-- Ensure we have all the proper triggers set up

-- 1. Trigger for creating matches and notifications when likes happen
DROP TRIGGER IF EXISTS trigger_match_on_like ON public.likes;
CREATE TRIGGER trigger_match_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_on_mutual_like();

-- 2. Trigger for sending message notification emails (this already exists but ensuring it's active)
-- This should already be created from previous migration

-- Let's check what triggers currently exist
DO $$ 
BEGIN 
  RAISE NOTICE 'Checking triggers...';
END $$;