-- Create trigger for likes to call the function
DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.create_match_on_mutual_like();

-- Enable realtime for key tables
ALTER publication supabase_realtime ADD TABLE public.notifications;
ALTER publication supabase_realtime ADD TABLE public.messages;
ALTER publication supabase_realtime ADD TABLE public.matches;
ALTER publication supabase_realtime ADD TABLE public.likes;