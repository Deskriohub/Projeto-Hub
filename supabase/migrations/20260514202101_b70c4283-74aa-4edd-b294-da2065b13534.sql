-- Allow admin and gestor (where they are NOT the evaluatee) to view all evaluation
-- subdata regardless of status, including drafts.
CREATE OR REPLACE FUNCTION public.can_view_evaluation(_eval_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.evaluations e
    WHERE e.id = _eval_id
      AND (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
        OR (
          e.evaluatee_id <> auth.uid()
          AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gestor'::app_role)
        )
        OR (e.evaluatee_id = auth.uid() AND e.status = 'published')
      )
  );
$function$;