-- ============================================================
-- Anotações livres — desvincula a anotação do One-on-One (2026-06-24)
-- Idempotente — pode rodar quantas vezes quiser.
--
-- Antes: a "anotação" era a coluna text public.one_on_one.anotacoes
--        (1 reunião = 1 blob de texto). Não dava pra anotar sem um 1:1.
-- Agora: tabela própria public.anotacoes, dona do LIDERADO.
--        - liderado_id  : obrigatório (a anotação pertence à pessoa)
--        - one_on_one_id: opcional (anotação livre = NULL; pauta de 1:1 = id)
--        - data         : escolhível pelo usuário (não só created_at)
--
-- A coluna one_on_one.anotacoes NÃO é removida aqui: vira BACKUP CONGELADO
-- (o app para de escrever nela). O drop está em
-- supabase/pending-migrations/ e só deve ser aplicado após confirmação.
-- ============================================================

-- ---------- 1) Tabela ----------
CREATE TABLE IF NOT EXISTS public.anotacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liderado_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,        -- NOT NULL aplicado no passo 4
  autor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  one_on_one_id uuid REFERENCES public.one_on_one(id) ON DELETE SET NULL, -- opcional: NULL = anotação livre
  data          date NOT NULL DEFAULT current_date,
  conteudo      text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anotacoes_liderado_data ON public.anotacoes (liderado_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_anotacoes_one_on_one    ON public.anotacoes (one_on_one_id);

-- ---------- 2) Pré-checagem: nenhum 1:1 com anotação e sem liderado ----------
-- (one_on_one.liderado_id já é NOT NULL, mas garantimos antes do backfill.)
DO $$
DECLARE bad int;
BEGIN
  SELECT count(*) INTO bad
  FROM public.one_on_one
  WHERE anotacoes IS NOT NULL AND btrim(anotacoes) <> '' AND liderado_id IS NULL;
  IF bad > 0 THEN
    RAISE EXCEPTION 'Abortado: % 1:1 com anotação preenchida e sem liderado associado.', bad;
  END IF;
END $$;

-- ---------- 3) Backfill: cada 1:1 com anotação não-vazia vira 1 linha ----------
-- Idempotente: não duplica se já existe anotação para aquele 1:1.
INSERT INTO public.anotacoes (liderado_id, autor_id, one_on_one_id, data, conteudo, created_at, updated_at)
SELECT o.liderado_id,
       o.gestor_id,
       o.id,
       o.data_reuniao,
       o.anotacoes,
       COALESCE(o.created_at, now()),
       COALESCE(o.updated_at, now())
FROM public.one_on_one o
WHERE o.anotacoes IS NOT NULL
  AND btrim(o.anotacoes) <> ''
  AND NOT EXISTS (SELECT 1 FROM public.anotacoes a WHERE a.one_on_one_id = o.id);

-- ---------- 4) Validar backfill e só então aplicar NOT NULL em liderado_id ----------
DO $$
DECLARE orphans int;
BEGIN
  SELECT count(*) INTO orphans FROM public.anotacoes WHERE liderado_id IS NULL;
  IF orphans > 0 THEN
    RAISE EXCEPTION 'Backfill incompleto: % anotações sem liderado_id — NOT NULL NÃO aplicado.', orphans;
  END IF;
END $$;

ALTER TABLE public.anotacoes ALTER COLUMN liderado_id SET NOT NULL;

-- ---------- 5) RLS ----------
-- Modelo de acesso (espelha one_on_one):
--   * dono da plataforma: tudo
--   * autor: as próprias anotações
--   * gestor responsável do liderado (profiles.gestor_id = eu): as do seu time
--   * o próprio liderado: SÓ as ligadas a um 1:1 dele (preserva o que ele já via);
--     anotações livres (one_on_one_id NULL) NÃO aparecem para o liderado.
ALTER TABLE public.anotacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anotacoes_select" ON public.anotacoes;
CREATE POLICY "anotacoes_select" ON public.anotacoes FOR SELECT TO authenticated
USING (
  public.is_owner(auth.uid())
  OR autor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = anotacoes.liderado_id AND p.gestor_id = auth.uid())
  OR (one_on_one_id IS NOT NULL AND liderado_id = auth.uid())
);

DROP POLICY IF EXISTS "anotacoes_insert" ON public.anotacoes;
CREATE POLICY "anotacoes_insert" ON public.anotacoes FOR INSERT TO authenticated
WITH CHECK (
  autor_id = auth.uid()
  AND (
    public.is_owner(auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = liderado_id AND p.gestor_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "anotacoes_update" ON public.anotacoes;
CREATE POLICY "anotacoes_update" ON public.anotacoes FOR UPDATE TO authenticated
USING (autor_id = auth.uid() OR public.is_owner(auth.uid()))
WITH CHECK (autor_id = auth.uid() OR public.is_owner(auth.uid()));

DROP POLICY IF EXISTS "anotacoes_delete" ON public.anotacoes;
CREATE POLICY "anotacoes_delete" ON public.anotacoes FOR DELETE TO authenticated
USING (autor_id = auth.uid() OR public.is_owner(auth.uid()));

-- ============================================================
-- CONFERÊNCIA (opcional):
--   -- nº de 1:1 com anotação deve bater com nº de anotações ligadas a 1:1
--   SELECT
--     (SELECT count(*) FROM public.one_on_one WHERE anotacoes IS NOT NULL AND btrim(anotacoes) <> '') AS origem,
--     (SELECT count(*) FROM public.anotacoes WHERE one_on_one_id IS NOT NULL) AS migradas;
-- ============================================================
