-- ============================================================
-- DROP da coluna legada one_on_one.anotacoes  (PENDENTE / MANUAL)
-- NÃO está em supabase/migrations/ de propósito: só aplicar após
-- confirmação. Ver supabase/pending-migrations/README.md.
-- ============================================================

-- Trava de segurança: aborta se houver anotação ligada a 1:1 que ainda
-- não foi migrada para public.anotacoes (evita perder texto).
DO $$
DECLARE faltando int;
BEGIN
  SELECT count(*) INTO faltando
  FROM public.one_on_one o
  WHERE o.anotacoes IS NOT NULL AND btrim(o.anotacoes) <> ''
    AND NOT EXISTS (SELECT 1 FROM public.anotacoes a WHERE a.one_on_one_id = o.id);
  IF faltando > 0 THEN
    RAISE EXCEPTION 'Abortado: % anotação(ões) ainda não migrada(s) — rode o backfill antes do drop.', faltando;
  END IF;
END $$;

ALTER TABLE public.one_on_one DROP COLUMN IF EXISTS anotacoes;
