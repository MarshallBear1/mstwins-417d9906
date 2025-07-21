-- Simplified trigger function that just creates notifications and matches
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if there's already a like from the liked user to the liker (mutual like)
  IF EXISTS (
    SELECT 1 FROM public.likes 
    WHERE liker_id = NEW.liked_id 
    AND liked_id = NEW.liker_id
  ) THEN
    -- Create a match (ensure consistent ordering)
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
    
    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES 
    (NEW.liker_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liked_id),
    (NEW.liked_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liker_id);
    
  ELSE
    -- Create a like notification for the liked user
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES (NEW.liked_id, 'like', 'Someone liked you!', 'You have a new like! Check it out.', NEW.liker_id);
  END IF;
  
  RETURN NEW;
END;
$function$;