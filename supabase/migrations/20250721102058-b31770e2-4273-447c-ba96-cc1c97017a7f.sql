-- Clean up all test data for production launch
-- Delete all messages first (references matches)
DELETE FROM public.messages;

-- Delete all notifications
DELETE FROM public.notifications;

-- Delete all matches
DELETE FROM public.matches;

-- Delete all likes 
DELETE FROM public.likes;

-- Delete all passes
DELETE FROM public.passes;

-- Delete all profiles (this will cascade to auth users through triggers if any exist)
DELETE FROM public.profiles;

-- Reset any sequences if they exist
SELECT setval(pg_get_serial_sequence('public.messages', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.notifications', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.matches', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.likes', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.passes', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.profiles', 'id'), 1, false);