CREATE OR REPLACE FUNCTION public.get_users_with_emails()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  role public.app_role
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.created_at,
         COALESCE(ur.role, 'geral'::public.app_role) AS role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_users_with_emails() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_users_with_emails() TO authenticated;