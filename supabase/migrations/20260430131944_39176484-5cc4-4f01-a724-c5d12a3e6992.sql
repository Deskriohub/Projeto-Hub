CREATE TABLE public.elogio_reacoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  elogio_id uuid REFERENCES public.elogios(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(elogio_id, user_id, emoji)
);

ALTER TABLE public.elogio_reacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view reactions" ON public.elogio_reacoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own reactions" ON public.elogio_reacoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON public.elogio_reacoes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_elogio_reacoes_elogio_id ON public.elogio_reacoes(elogio_id);