-- Remove the "New Like Limits Coming Soon" announcement popup
UPDATE public.robot_announcements 
SET is_active = false 
WHERE title = 'New Like Limits Coming Soon! 🤖' 
AND announcement_type = 'like_limit_announcement';