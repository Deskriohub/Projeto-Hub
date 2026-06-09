create table public.sugestoes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  texto text not null,
  anonima boolean default false not null,
  autor_id uuid references auth.users(id) on delete set null,
  autor_nome text
);

alter table public.sugestoes enable row level security;

create policy "Authenticated users can insert" on public.sugestoes
  for insert to authenticated with check (true);

create policy "Admins can read all" on public.sugestoes
  for select to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'::app_role)
  );