-- Harden has_role: only allow self-checks, or admin checking anyone
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid := auth.uid();
  _is_admin boolean;
BEGIN
  IF _caller IS NULL THEN
    RETURN false;
  END IF;

  -- Allow self-check freely
  IF _caller = _user_id THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;

  -- Otherwise, only admins may probe other users' roles
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _caller AND role = 'admin'::app_role
  ) INTO _is_admin;

  IF NOT _is_admin THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$function$;

-- Harden get_user_role: only self or admin
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid := auth.uid();
  _is_admin boolean;
BEGIN
  IF _caller IS NULL THEN
    RETURN NULL;
  END IF;

  IF _caller <> _user_id THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _caller AND role = 'admin'::app_role
    ) INTO _is_admin;

    IF NOT _is_admin THEN
      RETURN NULL;
    END IF;
  END IF;

  RETURN COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    'geral'::app_role
  );
END;
$function$;

-- Re-assert grants (idempotent): authenticated and service_role only
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;