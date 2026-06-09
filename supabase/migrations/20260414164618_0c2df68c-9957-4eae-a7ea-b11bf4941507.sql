
CREATE OR REPLACE FUNCTION public.protect_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM public.profiles WHERE id = OLD.user_id;
  IF _email = 'admin@deskrio.com.br' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_admin_role
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_admin_role();
