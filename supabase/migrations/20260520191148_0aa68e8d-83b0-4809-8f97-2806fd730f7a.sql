
CREATE TABLE public.premiacao_faixas (
  level_code text PRIMARY KEY,
  multiplo_min numeric NOT NULL,
  multiplo_max numeric NOT NULL,
  equity_max_pct numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.premiacao_faixas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and gestor can read premiacao_faixas"
  ON public.premiacao_faixas FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admin can insert premiacao_faixas"
  ON public.premiacao_faixas FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update premiacao_faixas"
  ON public.premiacao_faixas FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete premiacao_faixas"
  ON public.premiacao_faixas FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_premiacao_faixas_updated_at
  BEFORE UPDATE ON public.premiacao_faixas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.premiacao_faixas (level_code, multiplo_min, multiplo_max, equity_max_pct) VALUES
  ('L4', 1.0, 3.0, 60),
  ('L5', 1.5, 3.5, 70),
  ('L6', 2.0, 4.0, 80),
  ('M4', 1.0, 3.0, 60),
  ('M5', 1.5, 3.5, 70),
  ('M6', 2.0, 4.0, 80),
  ('M7', 2.5, 3.5, 90),
  ('M8', 3.0, 4.0, 100);

CREATE TABLE public.premiacao_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ano int NOT NULL,
  elegivel_level boolean NOT NULL,
  elegivel_meta boolean NOT NULL,
  elegivel_nota boolean NOT NULL,
  elegivel_final boolean NOT NULL,
  percentual_meta numeric,
  nota_media numeric,
  alcance_meta_norm numeric,
  alcance_nota_norm numeric,
  alcance_combinado numeric,
  faixas_por_periodo jsonb,
  salario_anual numeric,
  valor_premio numeric,
  fechado_em timestamptz NOT NULL DEFAULT now(),
  fechado_por uuid REFERENCES public.profiles(id),
  UNIQUE (user_id, ano)
);

ALTER TABLE public.premiacao_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and gestor can read premiacao_snapshots"
  ON public.premiacao_snapshots FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Admin can insert premiacao_snapshots"
  ON public.premiacao_snapshots FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update premiacao_snapshots"
  ON public.premiacao_snapshots FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete premiacao_snapshots"
  ON public.premiacao_snapshots FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_premiacao_snapshots_user_ano ON public.premiacao_snapshots(user_id, ano);
