-- ============================================================
-- Elogios de cliente + anexos (2026-06-24)
-- Idempotente — pode rodar quantas vezes quiser.
--
-- Antes: elogios só de colega → colega (remetente_id e destinatario_id
--        obrigatórios, sem anexo).
-- Agora: também registra elogio de CLIENTE, com print/imagem, vídeo ou áudio.
--        - origem      : 'interno' (colega) | 'cliente'
--        - cliente_nome: nome do cliente (quando origem='cliente')
--        - categoria   : sobre o quê é o elogio do cliente
--                        ('colaborador','atendimento','produto','plataforma','outro')
--        - anexo_*     : arquivo no bucket de Storage 'elogios'
--   O alvo (destinatario) e a mensagem passam a ser OPCIONAIS — o elogio do
--   cliente pode ser sobre atendimento/produto/plataforma, e o anexo pode ser
--   o próprio elogio. O remetente_id continua sendo quem REGISTROU o elogio
--   (mantém a RLS de insert existente: auth.uid() = remetente_id).
-- ============================================================

ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS origem       text NOT NULL DEFAULT 'interno';
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS cliente_nome text;
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS categoria        text;
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS categoria_detalhe text; -- texto livre quando categoria='outro'
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS anexo_url    text;
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS anexo_tipo   text; -- 'imagem' | 'video' | 'audio'
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS anexo_nome   text;

-- Alvo e mensagem deixam de ser obrigatórios
ALTER TABLE public.elogios ALTER COLUMN destinatario_id   DROP NOT NULL;
ALTER TABLE public.elogios ALTER COLUMN destinatario_nome DROP NOT NULL;
ALTER TABLE public.elogios ALTER COLUMN mensagem          DROP NOT NULL;

-- CHECK leve para origem (idempotente)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'elogios_origem_chk') THEN
    ALTER TABLE public.elogios ADD CONSTRAINT elogios_origem_chk CHECK (origem IN ('interno','cliente'));
  END IF;
END $$;

-- ---------- Storage: bucket de anexos de elogios ----------
INSERT INTO storage.buckets (id, name, public) VALUES ('elogios', 'elogios', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "elogios_anexo_read" ON storage.objects;
CREATE POLICY "elogios_anexo_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'elogios');

DROP POLICY IF EXISTS "elogios_anexo_insert" ON storage.objects;
CREATE POLICY "elogios_anexo_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'elogios' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "elogios_anexo_delete" ON storage.objects;
CREATE POLICY "elogios_anexo_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'elogios' AND auth.uid() IS NOT NULL);
