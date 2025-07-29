-- Create moderation_flags table to track content moderation
CREATE TABLE public.moderation_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'message', 'profile', 'bio', etc.
  content_id UUID, -- ID of the flagged content (message_id, profile_id, etc.)
  content_text TEXT NOT NULL,
  moderation_result JSONB NOT NULL, -- Full OpenAI moderation response
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flagged_categories TEXT[] DEFAULT '{}',
  confidence_score DECIMAL(3,2),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'auto_blocked'
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all moderation flags"
ON public.moderation_flags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create moderation flags"
ON public.moderation_flags
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_moderation_flags_updated_at
BEFORE UPDATE ON public.moderation_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add moderation status to messages table
ALTER TABLE public.messages 
ADD COLUMN moderation_status TEXT DEFAULT 'pending',
ADD COLUMN moderation_flag_id UUID REFERENCES public.moderation_flags(id);

-- Add moderation status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN moderation_status TEXT DEFAULT 'approved',
ADD COLUMN moderation_flag_id UUID REFERENCES public.moderation_flags(id);