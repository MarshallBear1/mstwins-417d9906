-- Add Content Moderation System
-- Create tables for advanced content reporting and moderation

-- Create content reports table for user-generated content reports
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id TEXT NOT NULL, -- ID of the content being reported (message ID, profile ID, etc.)
  content_type TEXT NOT NULL CHECK (content_type IN ('message', 'profile', 'photo')),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on content_reports
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create content reports" 
ON public.content_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" 
ON public.content_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

-- Admins and moderators can manage all reports
CREATE POLICY "Admins can manage all content reports" 
ON public.content_reports 
FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Create moderation log table to track AI and automated decisions
CREATE TABLE public.moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('message', 'profile', 'photo')),
  content_text TEXT,
  moderation_type TEXT NOT NULL CHECK (moderation_type IN ('openai_text', 'openai_vision', 'keyword_filter', 'url_filter')),
  flagged BOOLEAN NOT NULL DEFAULT false,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  categories TEXT[], -- Array of detected violation categories
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00 confidence from AI
  action_taken TEXT DEFAULT 'none' CHECK (action_taken IN ('none', 'filtered', 'blocked', 'flagged_for_review')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on moderation_log
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation logs
CREATE POLICY "Admins can view moderation logs" 
ON public.moderation_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- System can insert moderation logs
CREATE POLICY "System can insert moderation logs" 
ON public.moderation_log 
FOR INSERT 
WITH CHECK (true);

-- Create banned keywords table for customizable filtering
CREATE TABLE public.banned_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on banned_keywords
ALTER TABLE public.banned_keywords ENABLE ROW LEVEL SECURITY;

-- Only admins can manage banned keywords
CREATE POLICY "Admins can manage banned keywords" 
ON public.banned_keywords 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Insert default banned keywords for scam protection
INSERT INTO public.banned_keywords (keyword, severity, category) VALUES
-- High severity scam keywords
('cashapp', 'high', 'scam'),
('venmo', 'high', 'scam'),
('paypal', 'high', 'scam'),
('zelle', 'high', 'scam'),
('send money', 'high', 'scam'),
('wire transfer', 'high', 'scam'),
('bitcoin', 'high', 'scam'),
('crypto', 'high', 'scam'),
('inheritance', 'high', 'scam'),
('lottery', 'high', 'scam'),
('million dollars', 'high', 'scam'),
('prince', 'high', 'scam'),

-- Medium severity external platform redirects
('instagram', 'medium', 'external_platform'),
('snapchat', 'medium', 'external_platform'),
('telegram', 'medium', 'external_platform'),
('whatsapp', 'medium', 'external_platform'),
('kik', 'medium', 'external_platform'),
('discord', 'medium', 'external_platform'),

-- Medium severity inappropriate content
('lonely', 'medium', 'inappropriate'),
('horny', 'medium', 'inappropriate'),
('sexy', 'medium', 'inappropriate'),
('hookup', 'medium', 'inappropriate'),

-- Low severity general monitoring
('website', 'low', 'monitoring'),
('link', 'low', 'monitoring'),
('email', 'low', 'monitoring');

-- Create function to get active banned keywords
CREATE OR REPLACE FUNCTION public.get_banned_keywords()
RETURNS TABLE(keyword TEXT, severity TEXT, category TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT k.keyword, k.severity, k.category
  FROM public.banned_keywords k
  WHERE k.is_active = true
  ORDER BY 
    CASE k.severity 
      WHEN 'high' THEN 1 
      WHEN 'medium' THEN 2 
      ELSE 3 
    END,
    k.keyword;
$$;

-- Create function to log moderation events
CREATE OR REPLACE FUNCTION public.log_moderation_event(
  content_id_param TEXT,
  content_type_param TEXT,
  content_text_param TEXT,
  moderation_type_param TEXT,
  flagged_param BOOLEAN,
  severity_param TEXT DEFAULT 'low',
  categories_param TEXT[] DEFAULT '{}',
  confidence_score_param DECIMAL DEFAULT NULL,
  action_taken_param TEXT DEFAULT 'none',
  user_id_param UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.moderation_log (
    content_id,
    content_type,
    content_text,
    moderation_type,
    flagged,
    severity,
    categories,
    confidence_score,
    action_taken,
    user_id
  ) VALUES (
    content_id_param,
    content_type_param,
    CASE 
      WHEN length(content_text_param) > 500 THEN substring(content_text_param, 1, 500) || '...'
      ELSE content_text_param
    END,
    moderation_type_param,
    flagged_param,
    severity_param,
    categories_param,
    confidence_score_param,
    action_taken_param,
    user_id_param
  );
END;
$$;

-- Create function for enhanced content filtering using banned keywords
CREATE OR REPLACE FUNCTION public.check_content_against_keywords(content_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  keyword_record RECORD;
  flagged BOOLEAN := false;
  highest_severity TEXT := 'low';
  matched_keywords TEXT[] := '{}';
  result JSONB;
BEGIN
  -- Check content against all active banned keywords
  FOR keyword_record IN 
    SELECT keyword, severity, category 
    FROM public.banned_keywords 
    WHERE is_active = true
  LOOP
    -- Case-insensitive pattern matching
    IF content_text ~* ('\y' || keyword_record.keyword || '\y') THEN
      flagged := true;
      matched_keywords := array_append(matched_keywords, keyword_record.keyword);
      
      -- Update severity to highest found
      IF keyword_record.severity = 'high' OR 
         (keyword_record.severity = 'medium' AND highest_severity = 'low') THEN
        highest_severity := keyword_record.severity;
      END IF;
    END IF;
  END LOOP;
  
  result := jsonb_build_object(
    'flagged', flagged,
    'severity', highest_severity,
    'matched_keywords', matched_keywords,
    'total_matches', array_length(matched_keywords, 1)
  );
  
  RETURN result;
END;
$$;

-- Add indexes for performance
CREATE INDEX idx_content_reports_status ON public.content_reports(status);
CREATE INDEX idx_content_reports_reporter ON public.content_reports(reporter_id);
CREATE INDEX idx_content_reports_reported_user ON public.content_reports(reported_user_id);
CREATE INDEX idx_content_reports_created_at ON public.content_reports(created_at);
CREATE INDEX idx_moderation_log_user_id ON public.moderation_log(user_id);
CREATE INDEX idx_moderation_log_created_at ON public.moderation_log(created_at);
CREATE INDEX idx_moderation_log_flagged ON public.moderation_log(flagged);
CREATE INDEX idx_banned_keywords_active ON public.banned_keywords(is_active);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_content_reports_updated_at
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banned_keywords_updated_at
  BEFORE UPDATE ON public.banned_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column(); 