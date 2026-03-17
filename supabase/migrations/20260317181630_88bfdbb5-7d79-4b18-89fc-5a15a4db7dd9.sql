
-- Fix notifications insert policy to restrict to service role or the user themselves
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'sa') OR public.has_role(auth.uid(), 'org'));
