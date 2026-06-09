-- Remove broad authenticated SELECT on profiles
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;

-- Directory view: id + full_name only. Bypasses RLS via security_invoker=off (default for views owned by postgres).
CREATE OR REPLACE VIEW public.profiles_directory
WITH (security_invoker = false) AS
SELECT id, full_name FROM public.profiles;

GRANT SELECT ON public.profiles_directory TO authenticated;
REVOKE ALL ON public.profiles_directory FROM anon;