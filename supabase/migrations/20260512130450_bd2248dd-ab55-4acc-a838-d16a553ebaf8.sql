drop policy if exists "Admin can upload to configuracoes bucket" on storage.objects;
drop policy if exists "Admin can update configuracoes bucket" on storage.objects;

create policy "Admin can upload to configuracoes bucket"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'configuracoes'
    and exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admin can update configuracoes bucket"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'configuracoes'
    and exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );