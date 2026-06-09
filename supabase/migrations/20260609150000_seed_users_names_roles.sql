-- Seed: atualiza full_name em profiles e roles para os usuários da plataforma.
-- Rode APÓS criar os usuários no painel Authentication > Users do Supabase.
-- Os UUIDs são resolvidos pelo e-mail cadastrado em auth.users.

-- ─── Nomes ──────────────────────────────────────────────────────────────────
UPDATE public.profiles SET full_name = 'Matheus Pereira'
  WHERE email = 'matheus.pereira@deskrio.com.br';

UPDATE public.profiles SET full_name = 'Claudio Medeiros'
  WHERE email = 'claudio.medeiros@deskrio.com.br';

UPDATE public.profiles SET full_name = 'Lucas Carvalho'
  WHERE email = 'lucas.carvalho@deskrio.com.br';

UPDATE public.profiles SET full_name = 'Allan Angelo'
  WHERE email = 'allanangelonf@gmail.com';

UPDATE public.profiles SET full_name = 'Vinícius Gonçalves'
  WHERE email = 'vinisaio10@gmail.com';

UPDATE public.profiles SET full_name = 'Allex Thiago'
  WHERE email = 'allexthiagodev@gmail.com';

UPDATE public.profiles SET full_name = 'Leonardo Calvet'
  WHERE email = 'leonardofmcalvet@gmail.com';

UPDATE public.profiles SET full_name = 'Kevin Monteiro'
  WHERE email = 'kevinmonteiro343@gmail.com';

UPDATE public.profiles SET full_name = 'Jhenny Galdino'
  WHERE email = 'jhenny.galdino@deskrio.com.br';

UPDATE public.profiles SET full_name = 'Rakel Monteiro'
  WHERE email = 'rakelmonteiro06@gmail.com';

UPDATE public.profiles SET full_name = 'Waslley Freixo'
  WHERE email = 'waslleydsf@gmail.com';

-- ─── Roles ──────────────────────────────────────────────────────────────────
-- Admins
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email IN (
  'matheus.pereira@deskrio.com.br',
  'claudio.medeiros@deskrio.com.br',
  'lucas.carvalho@deskrio.com.br'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Usuários gerais (todos os demais entram como 'geral' — padrão já definido
-- pelo trigger handle_new_user, mas garantimos explicitamente aqui)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'geral'::app_role FROM auth.users
WHERE email IN (
  'allanangelonf@gmail.com',
  'vinisaio10@gmail.com',
  'allexthiagodev@gmail.com',
  'leonardofmcalvet@gmail.com',
  'kevinmonteiro343@gmail.com',
  'jhenny.galdino@deskrio.com.br',
  'rakelmonteiro06@gmail.com',
  'waslleydsf@gmail.com'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'geral';
