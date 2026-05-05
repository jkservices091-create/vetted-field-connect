-- Update the new-user trigger to also create a role-specific profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  selected_role public.app_role;
  display_name text;
BEGIN
  display_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', '');

  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    display_name,
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );

  selected_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::public.app_role,
    'worker'
  );

  -- Never allow self-assigning admin
  IF selected_role = 'admin' THEN
    selected_role := 'worker';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);

  -- Create a role-specific profile row so the user has a complete record
  IF selected_role = 'worker' THEN
    INSERT INTO public.worker_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  ELSIF selected_role = 'hiring_party' THEN
    INSERT INTO public.hiring_party_profiles (user_id, company_name)
    VALUES (NEW.id, COALESCE(NULLIF(display_name, ''), 'My company'))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists (recreate to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: every existing user with a worker role but no worker profile
INSERT INTO public.worker_profiles (user_id)
SELECT ur.user_id
FROM public.user_roles ur
WHERE ur.role = 'worker'
  AND NOT EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.user_id = ur.user_id)
ON CONFLICT DO NOTHING;

-- Backfill: every existing user with a hiring_party role but no hiring profile
INSERT INTO public.hiring_party_profiles (user_id, company_name)
SELECT ur.user_id, COALESCE(NULLIF(p.full_name, ''), 'My company')
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE ur.role = 'hiring_party'
  AND NOT EXISTS (SELECT 1 FROM public.hiring_party_profiles hpp WHERE hpp.user_id = ur.user_id)
ON CONFLICT DO NOTHING;