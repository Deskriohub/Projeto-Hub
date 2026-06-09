CREATE TABLE public.evaluation_promotion_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  approved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, approver_id)
);

ALTER TABLE public.evaluation_promotion_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View approvals via parent eval"
ON public.evaluation_promotion_approvals
FOR SELECT
TO authenticated
USING (public.can_view_evaluation(evaluation_id));

CREATE POLICY "Admin or gestor can approve (not self-evaluator)"
ON public.evaluation_promotion_approvals
FOR INSERT
TO authenticated
WITH CHECK (
  approver_id = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'gestor'::app_role)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.evaluations e
    WHERE e.id = evaluation_id AND e.evaluator_id = auth.uid()
  )
);

CREATE POLICY "Approver can delete own while draft"
ON public.evaluation_promotion_approvals
FOR DELETE
TO authenticated
USING (
  approver_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.evaluations e
    WHERE e.id = evaluation_id AND e.status = 'draft'
  )
);

GRANT SELECT, INSERT, DELETE ON public.evaluation_promotion_approvals TO authenticated;

CREATE INDEX idx_eval_promo_approvals_eval ON public.evaluation_promotion_approvals(evaluation_id);