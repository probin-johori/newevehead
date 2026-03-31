
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );

  -- Auto-assign SA role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'sa')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;
