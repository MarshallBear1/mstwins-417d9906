-- Create forum posts table
CREATE TABLE public.forum_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  flair text NOT NULL DEFAULT 'general',
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  moderation_status text DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'under_review'))
);

-- Create forum comments table
CREATE TABLE public.forum_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  likes_count integer NOT NULL DEFAULT 0,
  moderation_status text DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'under_review'))
);

-- Create forum likes table (for posts)
CREATE TABLE public.forum_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create forum comment likes table
CREATE TABLE public.forum_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on all forum tables
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum_posts
CREATE POLICY "Anyone can view approved forum posts" 
ON public.forum_posts 
FOR SELECT 
USING (moderation_status = 'approved');

CREATE POLICY "Users can create forum posts" 
ON public.forum_posts 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own forum posts" 
ON public.forum_posts 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own forum posts" 
ON public.forum_posts 
FOR DELETE 
USING (auth.uid() = author_id);

-- RLS Policies for forum_comments
CREATE POLICY "Anyone can view approved forum comments" 
ON public.forum_comments 
FOR SELECT 
USING (moderation_status = 'approved');

CREATE POLICY "Users can create forum comments" 
ON public.forum_comments 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own forum comments" 
ON public.forum_comments 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own forum comments" 
ON public.forum_comments 
FOR DELETE 
USING (auth.uid() = author_id);

-- RLS Policies for forum_likes
CREATE POLICY "Anyone can view forum likes" 
ON public.forum_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create forum likes" 
ON public.forum_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forum likes" 
ON public.forum_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for forum_comment_likes
CREATE POLICY "Anyone can view forum comment likes" 
ON public.forum_comment_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create forum comment likes" 
ON public.forum_comment_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forum comment likes" 
ON public.forum_comment_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_forum_posts_author_id ON public.forum_posts(author_id);
CREATE INDEX idx_forum_posts_created_at ON public.forum_posts(created_at DESC);
CREATE INDEX idx_forum_posts_flair ON public.forum_posts(flair);
CREATE INDEX idx_forum_comments_post_id ON public.forum_comments(post_id);
CREATE INDEX idx_forum_comments_author_id ON public.forum_comments(author_id);
CREATE INDEX idx_forum_likes_post_id ON public.forum_likes(post_id);
CREATE INDEX idx_forum_comment_likes_comment_id ON public.forum_comment_likes(comment_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_comments_updated_at
  BEFORE UPDATE ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update like counts
CREATE OR REPLACE FUNCTION public.update_forum_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update comment counts
CREATE OR REPLACE FUNCTION public.update_forum_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update comment like counts
CREATE OR REPLACE FUNCTION public.update_forum_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_comments 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic count updates
CREATE TRIGGER forum_post_like_count_trigger
  AFTER INSERT OR DELETE ON public.forum_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_post_like_count();

CREATE TRIGGER forum_post_comment_count_trigger
  AFTER INSERT OR DELETE ON public.forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_post_comment_count();

CREATE TRIGGER forum_comment_like_count_trigger
  AFTER INSERT OR DELETE ON public.forum_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_forum_comment_like_count();

-- Enable realtime for forum tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comment_likes;