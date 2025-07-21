-- Add DELETE policy for messages table so users can delete messages from their matches
CREATE POLICY "Users can delete messages they sent or received" 
ON public.messages 
FOR DELETE 
USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));