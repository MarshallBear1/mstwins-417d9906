-- Disable all cron jobs that trigger email processing to stop the spam
UPDATE cron.job SET active = false WHERE command LIKE '%email%';