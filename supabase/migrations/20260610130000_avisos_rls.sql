-- Avisos: direcionamento real por RLS (2026-06-10)
-- Aviso marcado para pessoas específicas só é visível (e notificável) para elas,
-- para o criador e para o dono. "Todos" (sem destinatários) continua para a empresa toda.
-- Depende de public.is_owner() e public.has_role() (rodar após 20260610120000).
-- Idempotente.

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Derruba qualquer policy antiga (nomes desconhecidos) para não sobrar leitura aberta.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'avisos'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.avisos', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "read_avisos" ON public.avisos FOR SELECT TO authenticated USING (
  destinatarios IS NULL
  OR array_length(destinatarios, 1) IS NULL
  OR created_by = auth.uid()
  OR auth.uid() = ANY(destinatarios)
  OR public.is_owner(auth.uid())
);
CREATE POLICY "insert_avisos" ON public.avisos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());
CREATE POLICY "update_avisos" ON public.avisos FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_owner(auth.uid()));
CREATE POLICY "delete_avisos" ON public.avisos FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
