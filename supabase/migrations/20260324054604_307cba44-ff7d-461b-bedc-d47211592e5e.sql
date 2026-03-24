-- Create invite link tokens for org/event joins
CREATE TABLE IF NOT EXISTS public.join_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  event_id UUID NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.join_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active join tokens"
ON public.join_tokens
FOR SELECT
TO anon, authenticated
USING (expires_at > now());

CREATE POLICY "Org admins can create join tokens"
ON public.join_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.org_id = join_tokens.org_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Org admins can update join tokens"
ON public.join_tokens
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.org_id = join_tokens.org_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.org_id = join_tokens.org_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Org admins can delete join tokens"
ON public.join_tokens
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.org_id = join_tokens.org_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('admin', 'manager')
  )
);

-- Join flow RPC: secure membership creation from token
CREATE OR REPLACE FUNCTION public.accept_join_token(_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _token_row public.join_tokens%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT *
  INTO _token_row
  FROM public.join_tokens
  WHERE token = _token
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  INSERT INTO public.team_members (org_id, user_id, invited_by, role)
  VALUES (_token_row.org_id, _uid, _token_row.created_by, COALESCE(_token_row.role, 'member'))
  ON CONFLICT (org_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;

  -- Optional event-scoped access for links tied to a specific event
  IF _token_row.event_id IS NOT NULL THEN
    INSERT INTO public.admin_event_access (admin_id, event_id)
    VALUES (_uid, _token_row.event_id::text)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'org_id', _token_row.org_id,
    'event_id', _token_row.event_id,
    'role', _token_row.role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_join_token(TEXT) TO authenticated;

-- Ensure organisation updates are realtime for org-name edits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'organisations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organisations;
  END IF;
END
$$;