-- Create the app_role enum type that's missing
CREATE TYPE app_role AS ENUM ('user', 'admin', 'moderator');

-- Update the send_announcement_email function to work correctly
CREATE OR REPLACE FUNCTION public.send_announcement_email(campaign_name text, email_subject text, email_content text, list_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  campaign_id uuid;
  list_id uuid;
  email_count integer;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if user has admin role (skip check if called from edge function)
  IF current_user_id IS NOT NULL AND NOT public.has_role(current_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Get the list ID
  SELECT id INTO list_id 
  FROM public.announcement_email_lists 
  WHERE announcement_email_lists.list_name = send_announcement_email.list_name;
  
  IF list_id IS NULL THEN
    RAISE EXCEPTION 'Email list not found: %', list_name;
  END IF;
  
  -- Count active emails in the list
  SELECT COUNT(*) INTO email_count
  FROM public.announcement_email_addresses
  WHERE announcement_email_addresses.list_id = send_announcement_email.list_id
    AND status = 'active';
  
  -- Create the campaign
  INSERT INTO public.announcement_campaigns (
    campaign_name, subject, content, list_id, created_by
  ) VALUES (
    send_announcement_email.campaign_name,
    email_subject,
    email_content,
    send_announcement_email.list_id,
    COALESCE(current_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) RETURNING id INTO campaign_id;
  
  -- Log the campaign creation
  IF current_user_id IS NOT NULL THEN
    PERFORM public.log_admin_action(
      'announcement_campaign_created',
      jsonb_build_object(
        'campaign_id', campaign_id,
        'list_name', list_name,
        'email_count', email_count
      )
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', campaign_id,
    'email_count', email_count,
    'message', 'Campaign created successfully'
  );
END;
$function$;