alter table public.one_on_one_todos
  add column if not exists concluido_por_id uuid references auth.users(id) on delete set null,
  add column if not exists concluido_por_nome text,
  add column if not exists concluido_em timestamp with time zone;