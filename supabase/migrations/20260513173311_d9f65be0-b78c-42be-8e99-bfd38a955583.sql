
ALTER TABLE public.evaluation_competency_results ADD COLUMN IF NOT EXISTS comment text;

CREATE TABLE IF NOT EXISTS public.evaluation_competency_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  competency_name text NOT NULL,
  synthesis text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, competency_name)
);

ALTER TABLE public.evaluation_competency_syntheses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read syntheses via parent eval"
ON public.evaluation_competency_syntheses
FOR SELECT TO authenticated
USING (public.can_view_evaluation(evaluation_id));

CREATE POLICY "Insert syntheses via parent eval"
ON public.evaluation_competency_syntheses
FOR INSERT TO authenticated
WITH CHECK (public.can_edit_evaluation(evaluation_id));

CREATE POLICY "Update syntheses via parent eval"
ON public.evaluation_competency_syntheses
FOR UPDATE TO authenticated
USING (public.can_edit_evaluation(evaluation_id))
WITH CHECK (public.can_edit_evaluation(evaluation_id));

CREATE POLICY "Delete syntheses via parent eval"
ON public.evaluation_competency_syntheses
FOR DELETE TO authenticated
USING (public.can_edit_evaluation(evaluation_id));

CREATE TRIGGER update_evaluation_competency_syntheses_updated_at
BEFORE UPDATE ON public.evaluation_competency_syntheses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_competency_syntheses TO authenticated;
