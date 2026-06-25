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

-- ---------- ONE-ON-ONE ----------
ALTER TABLE public.one_on_one ADD COLUMN IF NOT EXISTS hora_reuniao time;

-- ---------- ANOTAÇÕES (livres, donas do liderado; 1:1 é opcional) ----------
-- Detalhes e backfill: migrations/20260624120000_anotacoes_livres.sql
CREATE TABLE IF NOT EXISTS public.anotacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liderado_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  one_on_one_id uuid REFERENCES public.one_on_one(id) ON DELETE SET NULL,
  data          date NOT NULL DEFAULT current_date,
  conteudo      text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_anotacoes_liderado_data ON public.anotacoes (liderado_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_anotacoes_one_on_one    ON public.anotacoes (one_on_one_id);
-- Backfill da coluna legada one_on_one.anotacoes (idempotente)
INSERT INTO public.anotacoes (liderado_id, autor_id, one_on_one_id, data, conteudo, created_at, updated_at)
SELECT o.liderado_id, o.gestor_id, o.id, o.data_reuniao, o.anotacoes,
       COALESCE(o.created_at, now()), COALESCE(o.updated_at, now())
FROM public.one_on_one o
WHERE o.anotacoes IS NOT NULL AND btrim(o.anotacoes) <> ''
  AND NOT EXISTS (SELECT 1 FROM public.anotacoes a WHERE a.one_on_one_id = o.id);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.anotacoes WHERE liderado_id IS NULL) THEN
    ALTER TABLE public.anotacoes ALTER COLUMN liderado_id SET NOT NULL;
  END IF;
END $$;
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

-- ---------- ELOGIOS: origem cliente + anexos ----------
-- Detalhes: migrations/20260624130000_elogios_cliente.sql
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS origem       text NOT NULL DEFAULT 'interno';
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS cliente_nome text;
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS categoria        text;
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS categoria_detalhe text;
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS anexo_url    text;
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS anexo_tipo   text;
ALTER TABLE public.elogios ADD COLUMN IF NOT EXISTS anexo_nome   text;
ALTER TABLE public.elogios ALTER COLUMN destinatario_id   DROP NOT NULL;
ALTER TABLE public.elogios ALTER COLUMN destinatario_nome DROP NOT NULL;
ALTER TABLE public.elogios ALTER COLUMN mensagem          DROP NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'elogios_origem_chk') THEN
    ALTER TABLE public.elogios ADD CONSTRAINT elogios_origem_chk CHECK (origem IN ('interno','cliente'));
  END IF;
END $$;

-- ---------- STORAGE BUCKETS ----------
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('elogios', 'elogios', true)
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

DROP POLICY IF EXISTS "elogios_anexo_read" ON storage.objects;
CREATE POLICY "elogios_anexo_read" ON storage.objects FOR SELECT USING (bucket_id = 'elogios');
DROP POLICY IF EXISTS "elogios_anexo_insert" ON storage.objects;
CREATE POLICY "elogios_anexo_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'elogios' AND auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "elogios_anexo_delete" ON storage.objects;
CREATE POLICY "elogios_anexo_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'elogios' AND auth.uid() IS NOT NULL);

-- ---------- LIMPEZA: remove Contexto da IA (redundante) ----------
DELETE FROM public.configuracoes WHERE id = 'ia_contexto';

-- ============================================================
-- ATUALIZAÇÃO 2026-06-10 — Times, permissões por gestor e notificações
-- ============================================================

-- ---------- PROFILES: gestor responsável + dono da plataforma ----------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gestor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_owner  boolean NOT NULL DEFAULT false;

-- Dono da plataforma: enxerga TUDO (todos os 1:1 e todos os logs), acima dos admins de time.
CREATE OR REPLACE FUNCTION public.is_owner(uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_owner FROM public.profiles WHERE id = uid), false);
$$;

-- Dono = Matheus
UPDATE public.profiles SET is_owner = true  WHERE email = 'matheus.pereira@deskrio.com.br';
UPDATE public.profiles SET is_owner = false WHERE email <> 'matheus.pereira@deskrio.com.br' AND is_owner = true;

-- Times fixos (gestor responsável de cada liderado) — ajustável depois na tela Usuários.
UPDATE public.profiles SET gestor_id = (SELECT id FROM public.profiles WHERE email = 'lucas.carvalho@deskrio.com.br')
  WHERE email IN ('rakelmonteiro06@gmail.com','waslleydsf@gmail.com','jhenny.galdino@deskrio.com.br');
UPDATE public.profiles SET gestor_id = (SELECT id FROM public.profiles WHERE email = 'claudio.medeiros@deskrio.com.br')
  WHERE email IN ('leonardofmcalvet@gmail.com','allexthiagodev@gmail.com','vinisaio10@gmail.com','allanangelonf@gmail.com','kevinmonteiro343@gmail.com');

-- ---------- ONE-ON-ONE: admin de time vê só o time dele; dono vê tudo ----------
-- Remove TODAS as policies antigas de SELECT (qualquer uma que sobrasse daria acesso amplo a admin)
DROP POLICY IF EXISTS "Admin sees all records" ON public.one_on_one;
DROP POLICY IF EXISTS "Gestor sees own records" ON public.one_on_one;
DROP POLICY IF EXISTS "Admin or gestor see all except own as liderado" ON public.one_on_one;
DROP POLICY IF EXISTS "Admin scoped one_on_one select" ON public.one_on_one;
CREATE POLICY "Admin scoped one_on_one select" ON public.one_on_one FOR SELECT TO authenticated
USING (
  liderado_id <> auth.uid()
  AND (
    public.is_owner(auth.uid())
    OR (
      (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'gestor'::app_role))
      AND gestor_id = auth.uid()
    )
  )
);
-- Liderado sempre vê os próprios 1:1
DROP POLICY IF EXISTS "Liderado sees own records" ON public.one_on_one;
CREATE POLICY "Liderado sees own records" ON public.one_on_one FOR SELECT TO authenticated
  USING (auth.uid() = liderado_id);
-- Dono gerencia tudo (manutenção): ver/criar/editar/excluir qualquer 1:1
DROP POLICY IF EXISTS "Owner manage one_on_one" ON public.one_on_one;
CREATE POLICY "Owner manage one_on_one" ON public.one_on_one FOR ALL TO authenticated
  USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));
DROP POLICY IF EXISTS "Owner manage one_on_one_todos" ON public.one_on_one_todos;
CREATE POLICY "Owner manage one_on_one_todos" ON public.one_on_one_todos FOR ALL TO authenticated
  USING (public.is_owner(auth.uid())) WITH CHECK (public.is_owner(auth.uid()));

-- ---------- AUDITORIA: logs de 1:1 só para o dono e o gestor do time ----------
ALTER TABLE public.auditoria ADD COLUMN IF NOT EXISTS time_gestor_id uuid;
DROP POLICY IF EXISTS "admins_read_auditoria" ON public.auditoria;
CREATE POLICY "admins_read_auditoria" ON public.auditoria FOR SELECT USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND (
    public.is_owner(auth.uid())
    OR modulo <> 'One-on-One'
    OR time_gestor_id = auth.uid()
  )
);

-- ---------- NOTIFICACOES: permitir excluir (limpeza ao apagar 1:1) ----------
DROP POLICY IF EXISTS "delete_notif" ON public.notificacoes;
CREATE POLICY "delete_notif" ON public.notificacoes FOR DELETE USING (
  auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ---------- SUGESTÕES: ao criar, notifica admins e registra no log (via trigger) ----------
CREATE OR REPLACE FUNCTION public.on_nova_sugestao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Notifica todos os admins que há uma sugestão nova para responder
  INSERT INTO public.notificacoes (user_id, titulo, descricao, tipo, link)
  SELECT ur.user_id,
         'Nova sugestão recebida',
         CASE WHEN NEW.anonima THEN 'Uma sugestão anônima foi enviada.'
              ELSE COALESCE(NEW.autor_nome, 'Alguém') || ' enviou uma sugestão.' END,
         'sugestao', '/sugestoes'
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;

  -- Registra no log de auditoria (anônima entra sem vincular o autor)
  INSERT INTO public.auditoria (user_id, user_nome, acao, modulo, depois)
  VALUES (NEW.autor_id,
          CASE WHEN NEW.anonima THEN 'Anônimo' ELSE COALESCE(NEW.autor_nome, '—') END,
          'Enviou uma sugestão', 'Sugestões', NEW.texto);

  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_on_nova_sugestao ON public.sugestoes;
CREATE TRIGGER trg_on_nova_sugestao AFTER INSERT ON public.sugestoes
FOR EACH ROW EXECUTE FUNCTION public.on_nova_sugestao();

-- ---------- PROFILES: só o DONO pode mudar gestor_id / is_owner ----------
-- (admins comuns continuam podendo trocar foto, etc., mas não remanejam times)
CREATE OR REPLACE FUNCTION public.guard_profile_owner_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- auth.uid() NULL = execução via SQL/seed/service role → liberado
  IF auth.uid() IS NOT NULL AND NOT public.is_owner(auth.uid()) THEN
    IF NEW.gestor_id IS DISTINCT FROM OLD.gestor_id THEN
      RAISE EXCEPTION 'Apenas o dono da plataforma pode alterar o gestor responsável.';
    END IF;
    IF NEW.is_owner IS DISTINCT FROM OLD.is_owner THEN
      RAISE EXCEPTION 'Apenas o dono da plataforma pode alterar essa configuração.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_profile_owner_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_owner_fields BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_owner_fields();

-- ---------- AVISOS: direcionamento real por RLS ----------
-- Aviso marcado para pessoas específicas só é visível (e notificável) para elas,
-- para o criador e para o dono. "Todos" (sem destinatários) continua para a empresa toda.
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
-- derruba qualquer policy antiga (nomes desconhecidos) para não sobrar leitura aberta
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
