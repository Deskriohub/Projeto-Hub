create table public.one_on_one (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  gestor_id uuid references auth.users(id) on delete cascade not null,
  liderado_id uuid references auth.users(id) on delete cascade not null,
  liderado_nome text not null,
  data_reuniao date not null,
  anotacoes text,
  updated_at timestamp with time zone default now()
);

create table public.one_on_one_todos (
  id uuid default gen_random_uuid() primary key,
  one_on_one_id uuid references public.one_on_one(id) on delete cascade not null,
  texto text not null,
  concluido boolean default false not null,
  created_at timestamp with time zone default now()
);

alter table public.one_on_one enable row level security;

create policy "Gestor sees own records" on public.one_on_one
  for select to authenticated using (auth.uid() = gestor_id);

create policy "Admin sees all records" on public.one_on_one
  for select to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Gestor can insert own records" on public.one_on_one
  for insert to authenticated with check (auth.uid() = gestor_id);

create policy "Gestor can update own records" on public.one_on_one
  for update to authenticated using (auth.uid() = gestor_id);

create policy "Gestor can delete own records" on public.one_on_one
  for delete to authenticated using (auth.uid() = gestor_id);

alter table public.one_on_one_todos enable row level security;

create policy "Todos visible via one_on_one access" on public.one_on_one_todos
  for select to authenticated using (
    exists (select 1 from public.one_on_one o where o.id = one_on_one_id and (o.gestor_id = auth.uid() or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')))
  );

create policy "Insert todos via own one_on_one" on public.one_on_one_todos
  for insert to authenticated with check (
    exists (select 1 from public.one_on_one o where o.id = one_on_one_id and o.gestor_id = auth.uid())
  );

create policy "Update todos via own one_on_one" on public.one_on_one_todos
  for update to authenticated using (
    exists (select 1 from public.one_on_one o where o.id = one_on_one_id and o.gestor_id = auth.uid())
  );

create policy "Delete todos via own one_on_one" on public.one_on_one_todos
  for delete to authenticated using (
    exists (select 1 from public.one_on_one o where o.id = one_on_one_id and o.gestor_id = auth.uid())
  );