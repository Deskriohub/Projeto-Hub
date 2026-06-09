create policy "Authenticated users can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (true);