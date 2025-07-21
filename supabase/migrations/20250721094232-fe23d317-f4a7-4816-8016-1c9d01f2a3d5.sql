-- Add DELETE policy for matches table so users can remove their own matches
CREATE POLICY "Users can delete their own matches" 
ON public.matches 
FOR DELETE 
USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));