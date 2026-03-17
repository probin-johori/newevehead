
-- Create admin_event_access join table
CREATE TABLE public.admin_event_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, event_id)
);

ALTER TABLE public.admin_event_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view admin access"
ON public.admin_event_access FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage their own access"
ON public.admin_event_access FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'sa') OR public.has_role(auth.uid(), 'org')
);

CREATE POLICY "Admins can delete access"
ON public.admin_event_access FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'sa') OR public.has_role(auth.uid(), 'org')
);
