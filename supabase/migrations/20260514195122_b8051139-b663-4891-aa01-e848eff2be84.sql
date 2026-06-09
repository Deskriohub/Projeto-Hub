
-- ============= EVALUATIONS =============
DROP POLICY IF EXISTS "Admin sees all evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Gestor sees own evaluations as evaluator" ON public.evaluations;
DROP POLICY IF EXISTS "Evaluatee sees own published evaluations" ON public.evaluations;

CREATE POLICY "Admin or gestor see all except own as evaluatee"
ON public.evaluations FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role))
  AND evaluatee_id <> auth.uid()
);

CREATE POLICY "Evaluatee sees own published evaluations"
ON public.evaluations FOR SELECT TO authenticated
USING (evaluatee_id = auth.uid() AND status = 'published');

-- ============= ONE_ON_ONE =============
DROP POLICY IF EXISTS "Admin sees all records" ON public.one_on_one;
DROP POLICY IF EXISTS "Gestor sees own records" ON public.one_on_one;
DROP POLICY IF EXISTS "Liderado sees own records" ON public.one_on_one;

CREATE POLICY "Admin or gestor see all except own as liderado"
ON public.one_on_one FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role))
  AND liderado_id <> auth.uid()
);

CREATE POLICY "Liderado sees own records"
ON public.one_on_one FOR SELECT TO authenticated
USING (auth.uid() = liderado_id);
