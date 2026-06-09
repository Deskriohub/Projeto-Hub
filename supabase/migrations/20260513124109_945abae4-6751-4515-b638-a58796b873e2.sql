
-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- CATALOG TABLES
-- ============================================================

CREATE TABLE public.level_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL CHECK (code IN ('IC','MANAGER')),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_level_tracks_updated_at BEFORE UPDATE ON public.level_tracks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.level_tracks(id) ON DELETE RESTRICT,
  code text UNIQUE NOT NULL,
  ordinal int NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_levels_track_ordinal ON public.levels(track_id, ordinal);
CREATE TRIGGER trg_levels_updated_at BEFORE UPDATE ON public.levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order int NOT NULL,
  sum_threshold_high int NOT NULL DEFAULT 7,
  sum_threshold_low int NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level_id, name)
);
CREATE INDEX idx_competencies_level_order ON public.competencies(level_id, display_order);
CREATE TRIGGER trg_competencies_updated_at BEFORE UPDATE ON public.competencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id uuid NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  description text NOT NULL,
  display_order int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competency_id, display_order)
);
CREATE INDEX idx_behaviors_competency_order ON public.behaviors(competency_id, display_order);
CREATE TRIGGER trg_behaviors_updated_at BEFORE UPDATE ON public.behaviors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TRANSACTIONAL TABLES
-- ============================================================

CREATE TABLE public.evaluation_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_evaluation_cycles_updated_at BEFORE UPDATE ON public.evaluation_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluatee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  cycle_id uuid REFERENCES public.evaluation_cycles(id) ON DELETE RESTRICT,
  is_extraordinary boolean NOT NULL DEFAULT false,
  extraordinary_reason text,
  suspected_level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE RESTRICT,
  final_level_id uuid REFERENCES public.levels(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','awaiting_meeting','published')),
  manager_comments text,
  completed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_extraordinary_true CHECK (
    is_extraordinary = false OR (cycle_id IS NULL AND extraordinary_reason IS NOT NULL)
  ),
  CONSTRAINT chk_extraordinary_false CHECK (
    is_extraordinary = true OR cycle_id IS NOT NULL
  )
);
CREATE INDEX idx_evaluations_evaluatee ON public.evaluations(evaluatee_id);
CREATE INDEX idx_evaluations_evaluator ON public.evaluations(evaluator_id);
CREATE INDEX idx_evaluations_cycle ON public.evaluations(cycle_id);
CREATE INDEX idx_evaluations_status ON public.evaluations(status);
CREATE TRIGGER trg_evaluations_updated_at BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.evaluation_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  tested_level_id uuid NOT NULL REFERENCES public.levels(id) ON DELETE RESTRICT,
  round_number int NOT NULL,
  final_recommendation text CHECK (final_recommendation IN ('level_correto','avaliar_level_abaixo')),
  average_score numeric(4,2),
  median_score numeric(4,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, round_number)
);
CREATE INDEX idx_evaluation_rounds_eval_round ON public.evaluation_rounds(evaluation_id, round_number);
CREATE TRIGGER trg_evaluation_rounds_updated_at BEFORE UPDATE ON public.evaluation_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.evaluation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_round_id uuid NOT NULL REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
  behavior_id uuid NOT NULL REFERENCES public.behaviors(id) ON DELETE RESTRICT,
  score int NOT NULL CHECK (score IN (1,2,3)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluation_round_id, behavior_id)
);
CREATE INDEX idx_evaluation_responses_round ON public.evaluation_responses(evaluation_round_id);
CREATE TRIGGER trg_evaluation_responses_updated_at BEFORE UPDATE ON public.evaluation_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.evaluation_competency_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_round_id uuid NOT NULL REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES public.competencies(id) ON DELETE RESTRICT,
  sum_score int NOT NULL,
  median_score numeric(4,2) NOT NULL,
  recommendation text NOT NULL CHECK (recommendation IN ('raramente','as_vezes','consistencia')),
  recommendation_numeric int NOT NULL CHECK (recommendation_numeric IN (1,2,3)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluation_round_id, competency_id)
);
CREATE INDEX idx_evaluation_competency_results_round ON public.evaluation_competency_results(evaluation_round_id);
CREATE TRIGGER trg_evaluation_competency_results_updated_at BEFORE UPDATE ON public.evaluation_competency_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.level_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_competency_results ENABLE ROW LEVEL SECURITY;

-- Helper inline expression: admin check
-- (uses existing user_roles table)

-- Catalog: read for any authenticated, write for admin only
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['level_tracks','levels','competencies','behaviors','evaluation_cycles']
  LOOP
    EXECUTE format($f$
      CREATE POLICY "Authenticated can read %1$s"
        ON public.%1$I FOR SELECT TO authenticated USING (true);
      CREATE POLICY "Admin can insert %1$s"
        ON public.%1$I FOR INSERT TO authenticated
        WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role));
      CREATE POLICY "Admin can update %1$s"
        ON public.%1$I FOR UPDATE TO authenticated
        USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role))
        WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role));
      CREATE POLICY "Admin can delete %1$s"
        ON public.%1$I FOR DELETE TO authenticated
        USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role));
    $f$, t);
  END LOOP;
END$$;

-- evaluations
CREATE POLICY "Admin sees all evaluations"
  ON public.evaluations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role));

CREATE POLICY "Gestor sees own evaluations as evaluator"
  ON public.evaluations FOR SELECT TO authenticated
  USING (
    evaluator_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gestor'::app_role)
  );

CREATE POLICY "Evaluatee sees own published evaluations"
  ON public.evaluations FOR SELECT TO authenticated
  USING (evaluatee_id = auth.uid() AND status = 'published');

CREATE POLICY "Admin or gestor can insert evaluations"
  ON public.evaluations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
    OR (
      evaluator_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gestor'::app_role)
    )
  );

CREATE POLICY "Admin can update any evaluation"
  ON public.evaluations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role));

CREATE POLICY "Gestor can update own non-published evaluations"
  ON public.evaluations FOR UPDATE TO authenticated
  USING (
    evaluator_id = auth.uid() AND status <> 'published'
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gestor'::app_role)
  )
  WITH CHECK (
    evaluator_id = auth.uid() AND status <> 'published'
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gestor'::app_role)
  );

CREATE POLICY "Admin can delete evaluations"
  ON public.evaluations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role));

-- Helper to check parent evaluation visibility/edit access
CREATE OR REPLACE FUNCTION public.can_view_evaluation(_eval_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.evaluations e
    WHERE e.id = _eval_id
      AND (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
        OR (e.evaluator_id = auth.uid()
            AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gestor'::app_role))
        OR (e.evaluatee_id = auth.uid() AND e.status = 'published')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_evaluation(_eval_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.evaluations e
    WHERE e.id = _eval_id
      AND (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
        OR (e.evaluator_id = auth.uid() AND e.status <> 'published'
            AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gestor'::app_role))
      )
  );
$$;

-- evaluation_rounds policies
CREATE POLICY "Read rounds via parent eval"
  ON public.evaluation_rounds FOR SELECT TO authenticated
  USING (public.can_view_evaluation(evaluation_id));
CREATE POLICY "Insert rounds via parent eval"
  ON public.evaluation_rounds FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_evaluation(evaluation_id));
CREATE POLICY "Update rounds via parent eval"
  ON public.evaluation_rounds FOR UPDATE TO authenticated
  USING (public.can_edit_evaluation(evaluation_id))
  WITH CHECK (public.can_edit_evaluation(evaluation_id));
CREATE POLICY "Delete rounds via parent eval"
  ON public.evaluation_rounds FOR DELETE TO authenticated
  USING (public.can_edit_evaluation(evaluation_id));

-- evaluation_responses (resolve eval via round)
CREATE POLICY "Read responses via parent eval"
  ON public.evaluation_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_view_evaluation(r.evaluation_id)));
CREATE POLICY "Insert responses via parent eval"
  ON public.evaluation_responses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_edit_evaluation(r.evaluation_id)));
CREATE POLICY "Update responses via parent eval"
  ON public.evaluation_responses FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_edit_evaluation(r.evaluation_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_edit_evaluation(r.evaluation_id)));
CREATE POLICY "Delete responses via parent eval"
  ON public.evaluation_responses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_edit_evaluation(r.evaluation_id)));

-- evaluation_competency_results
CREATE POLICY "Read comp results via parent eval"
  ON public.evaluation_competency_results FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_view_evaluation(r.evaluation_id)));
CREATE POLICY "Insert comp results via parent eval"
  ON public.evaluation_competency_results FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_edit_evaluation(r.evaluation_id)));
CREATE POLICY "Update comp results via parent eval"
  ON public.evaluation_competency_results FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_edit_evaluation(r.evaluation_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_edit_evaluation(r.evaluation_id)));
CREATE POLICY "Delete comp results via parent eval"
  ON public.evaluation_competency_results FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.evaluation_rounds r WHERE r.id = evaluation_round_id AND public.can_edit_evaluation(r.evaluation_id)));

-- ============================================================
-- Initial cycle seed
-- ============================================================
INSERT INTO public.evaluation_cycles (code, name, start_date, end_date, status)
VALUES ('2026-S1','Primeiro Semestre 2026','2026-01-01','2026-06-30','open')
ON CONFLICT (code) DO NOTHING;
