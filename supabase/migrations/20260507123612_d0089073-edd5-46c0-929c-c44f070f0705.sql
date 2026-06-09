-- Remove the view from previous migration
DROP VIEW IF EXISTS public.profiles_directory;

-- Recreate broad SELECT policy
CREATE POLICY "Authenticated users can read profile directory"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Restrict authenticated role to non-sensitive columns only.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, full_name, created_at) ON public.profiles TO authenticated;