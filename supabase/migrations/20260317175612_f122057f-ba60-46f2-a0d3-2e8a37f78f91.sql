
-- Create team_members table to track org/team membership
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Users can see team members in their own org
CREATE POLICY "Users can view team members in their org"
ON public.team_members FOR SELECT TO authenticated
USING (
  org_id IN (SELECT org_id FROM public.team_members WHERE user_id = auth.uid())
);

-- Admins/org owners can add team members
CREATE POLICY "Admins can insert team members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'sa') OR public.has_role(auth.uid(), 'org')
);

-- Admins can remove team members
CREATE POLICY "Admins can delete team members"
ON public.team_members FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'sa') OR public.has_role(auth.uid(), 'org')
);

-- Admins can update team members
CREATE POLICY "Admins can update team members"
ON public.team_members FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'sa') OR public.has_role(auth.uid(), 'org')
);
