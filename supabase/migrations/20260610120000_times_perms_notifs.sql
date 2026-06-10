-- ============================================================
-- Times, permissões por gestor e notificações (2026-06-10)
-- Idempotente — pode rodar quantas vezes quiser.
-- Este é o ÚNICO arquivo que precisa ser rodado para esta leva de mudanças.
-- (Também está embutido em supabase/setup_completo.sql.)
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

-- Times fixos (gestor responsável de cada liderado). Depois, só o dono ajusta na tela Usuários.
UPDATE public.profiles SET gestor_id = (SELECT id FROM public.profiles WHERE email = 'lucas.carvalho@deskrio.com.br')
  WHERE email IN ('rakelmonteiro06@gmail.com','waslleydsf@gmail.com','jhenny.galdino@deskrio.com.br');
UPDATE public.profiles SET gestor_id = (SELECT id FROM public.profiles WHERE email = 'claudio.medeiros@deskrio.com.br')
  WHERE email IN ('leonardofmcalvet@gmail.com','allexthiagodev@gmail.com','vinisaio10@gmail.com','allanangelonf@gmail.com','kevinmonteiro343@gmail.com');

-- ---------- ONE-ON-ONE: admin de time vê só o time dele; dono vê tudo ----------
-- Derruba TODAS as policies antigas de SELECT (qualquer uma que sobrasse daria acesso amplo a admin).
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
-- Liderado sempre vê os próprios 1:1.
DROP POLICY IF EXISTS "Liderado sees own records" ON public.one_on_one;
CREATE POLICY "Liderado sees own records" ON public.one_on_one FOR SELECT TO authenticated
  USING (auth.uid() = liderado_id);
-- Dono gerencia tudo (manutenção): ver/criar/editar/excluir qualquer 1:1 e seus itens.
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

-- ---------- SUGESTÕES: ao criar, notifica admins e registra no log ----------
CREATE OR REPLACE FUNCTION public.on_nova_sugestao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notificacoes (user_id, titulo, descricao, tipo, link)
  SELECT ur.user_id,
         'Nova sugestão recebida',
         CASE WHEN NEW.anonima THEN 'Uma sugestão anônima foi enviada.'
              ELSE COALESCE(NEW.autor_nome, 'Alguém') || ' enviou uma sugestão.' END,
         'sugestao', '/sugestoes'
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::app_role;

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

-- ============================================================
-- CONFERÊNCIA (opcional): rode para ver as policies de SELECT do one_on_one.
-- Esperado: apenas "Admin scoped one_on_one select", "Liderado sees own records"
-- e "Owner manage one_on_one".
--   SELECT polname, cmd FROM pg_policies p
--   JOIN pg_class c ON c.relname = 'one_on_one'
--   WHERE schemaname = 'public' AND tablename = 'one_on_one';
-- ============================================================
