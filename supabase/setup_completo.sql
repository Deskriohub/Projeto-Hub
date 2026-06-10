-- ============================================================
-- SETUP COMPLETO E IDEMPOTENTE — Central DeskRio
-- Pode rodar quantas vezes quiser, sem quebrar nada.
-- Garante TODAS as tabelas, colunas, policies e buckets que o app usa.
-- ============================================================

-- ---------- PROFILES ----------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- ---------- AVISOS ----------
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS observacao   text;
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS publico      text NOT NULL DEFAULT 'todos';
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS data_inicio  date;
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS data_fim     date;
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS destinatarios uuid[];
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS ativo        boolean NOT NULL DEFAULT true;

-- ---------- EVENTOS ----------
CREATE TABLE IF NOT EXISTS public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  data_inicio date NOT NULL,
  data_fim date,
  hora_inicio time,
  hora_fim time,
  dia_todo boolean NOT NULL DEFAULT true,
  criado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS visibilidade  text NOT NULL DEFAULT 'todos';
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS participantes uuid[];
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_eventos" ON public.eventos;
CREATE POLICY "read_eventos" ON public.eventos FOR SELECT
  USING (auth.uid() IS NOT NULL AND (visibilidade = 'todos' OR criado_por = auth.uid() OR auth.uid() = ANY(participantes)));
DROP POLICY IF EXISTS "create_eventos" ON public.eventos;
CREATE POLICY "create_eventos" ON public.eventos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND criado_por = auth.uid());
DROP POLICY IF EXISTS "modify_eventos" ON public.eventos;
CREATE POLICY "modify_eventos" ON public.eventos FOR UPDATE USING (criado_por = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "delete_eventos" ON public.eventos;
CREATE POLICY "delete_eventos" ON public.eventos FOR DELETE USING (criado_por = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ---------- SUGESTOES ----------
ALTER TABLE public.sugestoes ADD COLUMN IF NOT EXISTS resposta      text;
ALTER TABLE public.sugestoes ADD COLUMN IF NOT EXISTS respondido_em timestamptz;
-- usuário comum lê as próprias sugestões (necessário para "Minhas Sugestões")
DROP POLICY IF EXISTS "Users read own sugestoes" ON public.sugestoes;
CREATE POLICY "Users read own sugestoes" ON public.sugestoes FOR SELECT TO authenticated
  USING (auth.uid() = autor_id);
-- usuário comum apaga as próprias sugestões; admin apaga qualquer uma
DROP POLICY IF EXISTS "Users delete own sugestoes" ON public.sugestoes;
CREATE POLICY "Users delete own sugestoes" ON public.sugestoes FOR DELETE TO authenticated
  USING (auth.uid() = autor_id OR public.has_role(auth.uid(), 'admin'));
-- admin responde (UPDATE) sugestões — sem isso a resposta não salva
DROP POLICY IF EXISTS "Admins update sugestoes" ON public.sugestoes;
CREATE POLICY "Admins update sugestoes" ON public.sugestoes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------- FEEDBACKS ----------
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  one_on_one_id uuid REFERENCES public.one_on_one(id) ON DELETE SET NULL,
  de_user_id uuid NOT NULL REFERENCES public.profiles(id),
  de_user_nome text NOT NULL,
  para_user_id uuid NOT NULL REFERENCES public.profiles(id),
  para_user_nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'positivo',
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_feedbacks" ON public.feedbacks;
CREATE POLICY "read_feedbacks" ON public.feedbacks FOR SELECT
  USING (auth.uid() = de_user_id OR auth.uid() = para_user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "create_feedbacks" ON public.feedbacks;
CREATE POLICY "create_feedbacks" ON public.feedbacks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND de_user_id = auth.uid());
DROP POLICY IF EXISTS "delete_feedbacks" ON public.feedbacks;
CREATE POLICY "delete_feedbacks" ON public.feedbacks FOR DELETE
  USING (de_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ---------- AUDITORIA ----------
CREATE TABLE IF NOT EXISTS public.auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_nome text,
  acao text NOT NULL,
  modulo text NOT NULL,
  detalhes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.auditoria ADD COLUMN IF NOT EXISTS antes  text;
ALTER TABLE public.auditoria ADD COLUMN IF NOT EXISTS depois text;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_read_auditoria" ON public.auditoria;
CREATE POLICY "admins_read_auditoria" ON public.auditoria FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "authenticated_insert_auditoria" ON public.auditoria;
CREATE POLICY "authenticated_insert_auditoria" ON public.auditoria FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ---------- NOTIFICACOES ----------
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'geral',
  link text,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_own_notif" ON public.notificacoes;
CREATE POLICY "read_own_notif" ON public.notificacoes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notif" ON public.notificacoes;
CREATE POLICY "update_own_notif" ON public.notificacoes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_notif" ON public.notificacoes;
CREATE POLICY "insert_notif" ON public.notificacoes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ---------- IA DOCUMENTOS (Base de Conhecimento) ----------
CREATE TABLE IF NOT EXISTS public.ia_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  conteudo text NOT NULL,
  arquivo_url text,
  tamanho int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.ia_documentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_ia_docs" ON public.ia_documentos;
CREATE POLICY "read_ia_docs" ON public.ia_documentos FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "admin_manage_ia_docs" ON public.ia_documentos;
CREATE POLICY "admin_manage_ia_docs" ON public.ia_documentos FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ---------- PROFILES: admin atualiza foto de qualquer um ----------
DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ---------- STORAGE BUCKETS ----------
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatar_public_read" ON storage.objects;
CREATE POLICY "avatar_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "avatar_upload" ON storage.objects;
CREATE POLICY "avatar_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "doc_read" ON storage.objects;
CREATE POLICY "doc_read" ON storage.objects FOR SELECT USING (bucket_id = 'documentos');
DROP POLICY IF EXISTS "doc_insert" ON storage.objects;
CREATE POLICY "doc_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documentos' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "doc_delete" ON storage.objects;
CREATE POLICY "doc_delete" ON storage.objects FOR DELETE USING (bucket_id = 'documentos' AND public.has_role(auth.uid(), 'admin'));

-- ---------- LIMPEZA: remove Contexto da IA (redundante) ----------
DELETE FROM public.configuracoes WHERE id = 'ia_contexto';
