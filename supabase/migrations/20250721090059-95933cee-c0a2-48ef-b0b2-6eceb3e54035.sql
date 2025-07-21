-- Update the match trigger to send email notifications
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  match_user1_profile RECORD;
  match_user2_profile RECORD;
  user1_email TEXT;
  user2_email TEXT;
BEGIN
  -- Check if there's already a like from the liked user to the liker
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
    
    -- Get user profiles for names
    SELECT first_name INTO match_user1_profile FROM public.profiles WHERE user_id = NEW.liker_id;
    SELECT first_name INTO match_user2_profile FROM public.profiles WHERE user_id = NEW.liked_id;
    
    -- Create notifications for both users
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES 
    (NEW.liker_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liked_id),
    (NEW.liked_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', NEW.liker_id);
    
    -- Send match notification emails
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'email', (SELECT email FROM auth.users WHERE id = NEW.liker_id),
        'firstName', match_user1_profile.first_name,
        'type', 'match',
        'fromUser', match_user2_profile.first_name
      )
    );
    
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'email', (SELECT email FROM auth.users WHERE id = NEW.liked_id),
        'firstName', match_user2_profile.first_name,
        'type', 'match',
        'fromUser', match_user1_profile.first_name
      )
    );
    
  ELSE
    -- Create a like notification
    INSERT INTO public.notifications (user_id, type, title, message, from_user_id)
    VALUES (NEW.liked_id, 'like', 'Someone liked you!', 'You have a new like! Check it out.', NEW.liker_id);
    
    -- Send like notification email
    DECLARE
      liked_user_profile RECORD;
      liker_profile RECORD;
    BEGIN
      SELECT first_name INTO liked_user_profile FROM public.profiles WHERE user_id = NEW.liked_id;
      SELECT first_name INTO liker_profile FROM public.profiles WHERE user_id = NEW.liker_id;
      
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'email', (SELECT email FROM auth.users WHERE id = NEW.liked_id),
          'firstName', liked_user_profile.first_name,
          'type', 'like',
          'fromUser', liker_profile.first_name
        )
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;