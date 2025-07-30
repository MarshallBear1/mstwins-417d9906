-- Update the forum announcement message to be more positive and encouraging
UPDATE robot_announcements 
SET message = '🎉 Welcome to the new Forum Feature! 

Thank you for all the bug reports and amazing feedback! 

✨ What''s New: ✨
• Share experiences & get support
• Connect with community members  
• Ask questions & help others
• Suggest and vote on new features

We''re building something amazing together! 💪

Keep the feedback coming - together we''re creating a supportive space for everyone in the MS community.'
WHERE title LIKE '%Forum%' AND is_active = true;