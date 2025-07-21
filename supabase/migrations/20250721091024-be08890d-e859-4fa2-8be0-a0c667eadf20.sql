-- Update the trigger function to use the email worker for better reliability
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  match_created BOOLEAN := FALSE;
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
    
    -- Set flag that match was created
    match_created := TRUE;
    
    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES 
    (NEW.liker_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liked_id),
    (NEW.liked_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liker_id);
    
    -- Send match emails using the email worker
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/email-notification-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'match',
        'likerUserId', NEW.liker_id::text,
        'likedUserId', NEW.liked_id::text
      )
    );
    
  ELSE
    -- Create a like notification for the liked user
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES (NEW.liked_id, 'like', 'Someone liked you!', 'You have a new like! Check it out.', NEW.liker_id);
    
    -- Send like email using the email worker
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/email-notification-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'like',
        'likerUserId', NEW.liker_id::text,
        'likedUserId', NEW.liked_id::text
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Set the required settings for the function
SELECT set_config('app.settings.supabase_url', 'https://fscendubnktdtmnxiipk.supabase.co', false);
SELECT set_config('app.settings.service_role_key', current_setting('supabase.service_role_key'), false);