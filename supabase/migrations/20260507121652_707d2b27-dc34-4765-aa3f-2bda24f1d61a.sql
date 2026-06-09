create table public.one_on_one_comentarios (
  id uuid default gen_random_uuid() primary key,
  one_on_one_id uuid references public.one_on_one(id) on delete cascade not null,
  autor_id uuid references auth.users(id) on delete cascade not null,
  autor_nome text not null,
  texto text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.one_on_one_comentarios enable row level security;

create policy "Read comments for accessible records" on public.one_on_one_comentarios
  for select to authenticated using (
    exists (
      select 1 from public.one_on_one o
      where o.id = one_on_one_id
      and (
        o.gestor_id = auth.uid()
        or o.liderado_id = auth.uid()
        or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
      )
    )
  );

create policy "Gestor or liderado can insert comments" on public.one_on_one_comentarios
  for insert to authenticated with check (
    auth.uid() = autor_id
    and exists (
      select 1 from public.one_on_one o
      where o.id = one_on_one_id
      and (o.gestor_id = auth.uid() or o.liderado_id = auth.uid())
    )
  );

create policy "Author can update own comments" on public.one_on_one_comentarios
  for update to authenticated using (auth.uid() = autor_id);

create policy "Author can delete own comments" on public.one_on_one_comentarios
  for delete to authenticated using (auth.uid() = autor_id);