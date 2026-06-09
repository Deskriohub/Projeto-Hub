DROP POLICY IF EXISTS "View approvals via parent eval" ON public.evaluation_promotion_approvals;

CREATE POLICY "View approvals via parent eval"
ON public.evaluation_promotion_approvals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations e
    WHERE e.id = evaluation_promotion_approvals.evaluation_id
  )
);