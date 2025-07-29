-- Create a table for storing email lists for announcements
CREATE TABLE public.announcement_email_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create a table for storing individual email addresses in lists
CREATE TABLE public.announcement_email_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES public.announcement_email_lists(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active, unsubscribed, bounced
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(list_id, email)
);

-- Create a table for tracking announcement email campaigns
CREATE TABLE public.announcement_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  list_id uuid NOT NULL REFERENCES public.announcement_email_lists(id),
  status text NOT NULL DEFAULT 'draft', -- draft, sending, completed, failed
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sent_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Enable RLS on all announcement tables
ALTER TABLE public.announcement_email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_email_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for announcement tables (admin only)
CREATE POLICY "Admins can manage announcement email lists" 
ON public.announcement_email_lists 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage announcement email addresses" 
ON public.announcement_email_addresses 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage announcement campaigns" 
ON public.announcement_campaigns 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert the migration announcement email list
INSERT INTO public.announcement_email_lists (list_name, description)
VALUES ('sharedgenes_migration', 'Email list for SharedGenes to MStwins migration announcement');

-- Get the list ID for inserting emails
DO $$
DECLARE
  list_uuid uuid;
BEGIN
  SELECT id INTO list_uuid 
  FROM public.announcement_email_lists 
  WHERE list_name = 'sharedgenes_migration';

  -- Insert all the provided email addresses
  INSERT INTO public.announcement_email_addresses (list_id, email)
  VALUES 
    (list_uuid, 'team@sharedgenes.org'),
    (list_uuid, 'auntbsdogghouse@gmail.com'),
    (list_uuid, 'chris86046@gmail.com'),
    (list_uuid, 'rmtattoo@aol.com'),
    (list_uuid, 'sgh8646@gmail.com'),
    (list_uuid, 'lindargoldblatt@gmail.com'),
    (list_uuid, 'craig.finnerty13@gmail.com'),
    (list_uuid, 'chirsch56@gmail.com'),
    (list_uuid, 'libmay531@yahoo.com'),
    (list_uuid, 'high_altitudes@hotmail.com'),
    (list_uuid, 'tana907@icloud.com'),
    (list_uuid, 'dlwmail@gmail.com'),
    (list_uuid, 'julieAstamm@gmail.com'),
    (list_uuid, 'roboinkc@yahoo.com'),
    (list_uuid, 'powerenew@gmail.com'),
    (list_uuid, 'annlnt@ymail.com'),
    (list_uuid, 'amitrippenms@gmail.com'),
    (list_uuid, 'stephanie@overcomingmyself.net'),
    (list_uuid, 'qwerqsar@gmail.com'),
    (list_uuid, 'harshinisurabhi227@gmail.com'),
    (list_uuid, 'rachel.bell44@gmail.com'),
    (list_uuid, 'd3nn1s_316@hotmail.co.uk'),
    (list_uuid, 'lisaw132@comcast.net'),
    (list_uuid, 'ronning93k@gmail.com'),
    (list_uuid, 'guidi.rachel@gmail.com'),
    (list_uuid, 'lxi_99@hotmail.com'),
    (list_uuid, 'danjunker07@gmail.com'),
    (list_uuid, 'ann_cihon@yahoo.com'),
    (list_uuid, 'kldunn101@gmail.com'),
    (list_uuid, 'holster1740@gmail.com'),
    (list_uuid, 'boarder661@yahoo.com'),
    (list_uuid, 'karstendaems90@gmail.com'),
    (list_uuid, 'darah.eckert@gmail.com'),
    (list_uuid, 'macs5657@gmail.com'),
    (list_uuid, 'ziggans77@gmail.com'),
    (list_uuid, 'cameron.brauncameron.braun@gmail.com'),
    (list_uuid, 'elevatenutrition50@gmail.com'),
    (list_uuid, 'tarukaquauhtezcatl@gmail.com'),
    (list_uuid, 'arobert_schwartz@yahoo.com'),
    (list_uuid, 'mettehelver@gmail.com'),
    (list_uuid, 'cjerrell1764@gmail.com'),
    (list_uuid, 'dadcain7414@gmail.com'),
    (list_uuid, 'leah2790@yahoo.com'),
    (list_uuid, 'sjade0014@gmail.com'),
    (list_uuid, 'rachelsibbitt98@gmail.com'),
    (list_uuid, 'juliestone1042@outlook.com'),
    (list_uuid, 'armaan.torabi@gmail.com'),
    (list_uuid, 'agegil15@yahoo.com'),
    (list_uuid, 'brettkelley79@gmail.com'),
    (list_uuid, 'azeghar@gmail.com'),
    (list_uuid, 'ravasheol@gmail.com'),
    (list_uuid, 'juju.a.fern@gmail.com'),
    (list_uuid, 'debra61924@gmail.com'),
    (list_uuid, 'matthewdellgrantham8305@gmail.com'),
    (list_uuid, 'agdeserio@gmail.com'),
    (list_uuid, 'c2keene@gmail.com'),
    (list_uuid, 'rfuller1978@gmail.com'),
    (list_uuid, 'ksenija-malahova@inbox.lv'),
    (list_uuid, 'susangilvarry@gmail.com'),
    (list_uuid, 'byeblackm@gmail.com'),
    (list_uuid, 'jhaley0804@gmail.com'),
    (list_uuid, 'lovespenguins1988@yahoo.com'),
    (list_uuid, 'coralrs7637@gmail.com'),
    (list_uuid, 'ak-joyce@hotmail.com'),
    (list_uuid, 'brennahusel@me.com'),
    (list_uuid, 'marykato27@yahoo.com'),
    (list_uuid, 'zoebear5798@gmail.com'),
    (list_uuid, 'salmahaidrani30@gmail.com'),
    (list_uuid, 'sara.hj.74@hotmail.co.uk'),
    (list_uuid, 'negelbain@yahoo.com'),
    (list_uuid, 'cmg51688@yahoo.com'),
    (list_uuid, 'katie-cartwright@hotmail.co.uk'),
    (list_uuid, 'cboutros3@gmail.com'),
    (list_uuid, 'felderkamara@gmail.com'),
    (list_uuid, 'nannicarella@gmail.com'),
    (list_uuid, 'blue747@live.ca'),
    (list_uuid, 'helgapuki@gmail.com'),
    (list_uuid, 'waneka816@gmail.com'),
    (list_uuid, 'allybelle96@yahoo.com'),
    (list_uuid, 'strutna@gmail.com'),
    (list_uuid, 'abecisneros94@gmail.com'),
    (list_uuid, 'lolananas.feuillade@gmail.com'),
    (list_uuid, 'drichmond13@gmail.com'),
    (list_uuid, 'dseiber250@gmail.com'),
    (list_uuid, 'mahirah768@gmail.com'),
    (list_uuid, 'g.mazzanti94@gmail.com'),
    (list_uuid, 'aurorazlightz@gmail.com'),
    (list_uuid, 'josh_guest@msn.com'),
    (list_uuid, 'cindymisener@gmail.com'),
    (list_uuid, 'smilynic@hotmail.com'),
    (list_uuid, 'benjrneal@btinternet.com'),
    (list_uuid, 'cassandraward03@gmail.com'),
    (list_uuid, 'alexpek8@gmail.com'),
    (list_uuid, 'mcdadejesse9@gmail.com'),
    (list_uuid, 'katiemorton1994@gmail.com'),
    (list_uuid, 'rsesmith02@gmail.com'),
    (list_uuid, 'nelarzate@gmail.com'),
    (list_uuid, 'missttkiss@gmail.com'),
    (list_uuid, 'cparkerrrr81@gmail.com'),
    (list_uuid, 'jaroslavspath@gmail.com'),
    (list_uuid, 'fpiv2354@gmail.com'),
    (list_uuid, 'juanjchavez.980@gmail.com'),
    (list_uuid, 'm30869705@gmail.com'),
    (list_uuid, 'christopher.j.isaak@gmail.com'),
    (list_uuid, 'felbinshaji@gmail.com'),
    (list_uuid, 'alinakorobko4@gmail.com'),
    (list_uuid, 'nbgfcn@gmail.com'),
    (list_uuid, 'weskarn@gmail.com'),
    (list_uuid, 'lmalpassf@gmail.com'),
    (list_uuid, 'carly.kaminsky@gmail.com'),
    (list_uuid, 'katy.sansum@yahoo.co.uk'),
    (list_uuid, 'louise.mullineux@hotmail.co.uk'),
    (list_uuid, 'rkellyplunkett@gmail.com'),
    (list_uuid, 'caecr173@icloud.com'),
    (list_uuid, 'stoutkaitlyn@gmail.com'),
    (list_uuid, 'aneli_90@hotmail.com'),
    (list_uuid, 'cassie.pollentier9784@gmail.com'),
    (list_uuid, 'zoe.selwood@hotmail.co.uk'),
    (list_uuid, 'luis.emanuel.ferreira2002@gmail.com'),
    (list_uuid, 'kreid5118@gmail.com'),
    (list_uuid, 'ekdkean@gmail.com'),
    (list_uuid, 'catheesjourney@gmail.com'),
    (list_uuid, 'newuser_1750159937372@example.com'),
    (list_uuid, 'gametest_1750160387264@example.com'),
    (list_uuid, 'swarre18@gmail.com'),
    (list_uuid, 'carlykwine@gmail.com'),
    (list_uuid, 'stefanija96@yahoo.com'),
    (list_uuid, 'joua.m@outlook.de'),
    (list_uuid, 'lisaob@mac.com'),
    (list_uuid, 'benmartinka3@gmail.com'),
    (list_uuid, 'arleenyb73@yahoo.com'),
    (list_uuid, 'omarm@hotmail.co.uk'),
    (list_uuid, 'wijkhuijs@live.nl'),
    (list_uuid, 'bjartakot@hotmail.com'),
    (list_uuid, 'gabriellapierre98@gmail.com'),
    (list_uuid, 'hibaalbaqali06@gmail.com'),
    (list_uuid, 'mariam.nawaz484@gmail.com'),
    (list_uuid, 'colleen-macdougall@hotmail.com'),
    (list_uuid, 'malebusa91@gmail.com'),
    (list_uuid, 'washingdarren@gmail.com'),
    (list_uuid, 'demididi16@hotmail.com'),
    (list_uuid, 'sam.druyts@gmail.com'),
    (list_uuid, 'craziladi009@gmail.com'),
    (list_uuid, 'scgmckenzivail@gmail.com'),
    (list_uuid, 'j.mattingly831@gmail.com'),
    (list_uuid, 'kellyvandehei@gmail.com'),
    (list_uuid, 'jadeevans732@gmail.com'),
    (list_uuid, 'jfred6606@gmail.com'),
    (list_uuid, 'cwp@shaw.ca'),
    (list_uuid, 'mariedegroot84@icloud.com');
END $$;

-- Create function to send announcement emails
CREATE OR REPLACE FUNCTION public.send_announcement_email(
  campaign_name text,
  email_subject text,
  email_content text,
  list_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  campaign_id uuid;
  list_id uuid;
  email_count integer;
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if user has admin role
  IF NOT public.has_role(current_user_id, 'admin'::app_role) THEN
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
    current_user_id
  ) RETURNING id INTO campaign_id;
  
  -- Log the campaign creation
  PERFORM public.log_admin_action(
    'announcement_campaign_created',
    jsonb_build_object(
      'campaign_id', campaign_id,
      'list_name', list_name,
      'email_count', email_count
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', campaign_id,
    'email_count', email_count,
    'message', 'Campaign created successfully'
  );
END;
$$;