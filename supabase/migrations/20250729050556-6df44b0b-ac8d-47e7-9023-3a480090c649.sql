-- Create delete_user_account function
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete account';
  END IF;
  
  -- Delete user data in the correct order (respecting foreign key constraints)
  -- Delete dependent records first
  DELETE FROM public.messages WHERE sender_id = current_user_id OR receiver_id = current_user_id;
  DELETE FROM public.likes WHERE liker_id = current_user_id OR liked_id = current_user_id;
  DELETE FROM public.passes WHERE passer_id = current_user_id OR passed_id = current_user_id;
  DELETE FROM public.matches WHERE user1_id = current_user_id OR user2_id = current_user_id;
  DELETE FROM public.notifications WHERE user_id = current_user_id OR from_user_id = current_user_id;
  DELETE FROM public.push_tokens WHERE user_id = current_user_id;
  DELETE FROM public.daily_likes WHERE user_id = current_user_id;
  DELETE FROM public.user_reports WHERE reporter_id = current_user_id OR reported_user_id = current_user_id;
  DELETE FROM public.feedback WHERE user_id = current_user_id;
  DELETE FROM public.user_roles WHERE user_id = current_user_id;
  DELETE FROM public.admin_sessions WHERE user_id = current_user_id;
  DELETE FROM public.re_engagement_emails WHERE user_id = current_user_id;
  DELETE FROM public.welcome_email_queue WHERE user_id = current_user_id;
  
  -- Delete profile (this should cascade to auth.users due to foreign key)
  DELETE FROM public.profiles WHERE user_id = current_user_id;
  
  -- Log the deletion
  PERFORM public.log_security_event(current_user_id, 'account_deleted', '{}'::jsonb);
END;
$function$;