
-- Create a security definer function to get user's org_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.team_members WHERE user_id = _user_id
$$;

-- Drop the old potentially recursive SELECT policy
DROP POLICY IF EXISTS "Users can view team members in their org" ON public.team_members;

-- Create safe SELECT policy using security definer function
CREATE POLICY "Users can view team members in their org"
ON public.team_members FOR SELECT TO authenticated
USING (
  org_id IN (SELECT public.get_user_org_ids(auth.uid()))
);
