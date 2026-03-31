
-- Fix any orphaned auth.users that have no profile (from failed signups before trigger existed)
INSERT INTO public.profiles (id, name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'name', ''), u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Also ensure they have a role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'sa'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL;
