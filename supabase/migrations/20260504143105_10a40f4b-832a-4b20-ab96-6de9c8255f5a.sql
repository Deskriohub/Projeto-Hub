create table public.configuracoes (
  id text primary key,
  valor text,
  updated_at timestamp with time zone default now()
);

alter table public.configuracoes enable row level security;

create policy "Authenticated users can read configuracoes" on public.configuracoes
  for select to authenticated using (true);

create policy "Admin can manage configuracoes" on public.configuracoes
  for all to authenticated using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

insert into public.configuracoes (id, valor) values ('mascote', null);

insert into storage.buckets (id, name, public) values ('configuracoes', 'configuracoes', true);

create policy "Public can read configuracoes bucket"
  on storage.objects for select
  using (bucket_id = 'configuracoes');

create policy "Admin can upload to configuracoes bucket"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'configuracoes' and
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admin can update configuracoes bucket"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'configuracoes' and
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admin can delete from configuracoes bucket"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'configuracoes' and
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );