
-- 1) Liderado can read own one_on_one records
create policy "Liderado sees own records"
  on public.one_on_one
  for select
  to authenticated
  using (auth.uid() = liderado_id);

-- 2) Strip author identity for anonymous suggestions at DB layer
create or replace function public.sugestoes_enforce_anonimato()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.anonima then
    new.autor_id := null;
    new.autor_nome := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sugestoes_enforce_anonimato on public.sugestoes;
create trigger trg_sugestoes_enforce_anonimato
  before insert or update on public.sugestoes
  for each row execute function public.sugestoes_enforce_anonimato();

-- Scrub any pre-existing anonymous rows
update public.sugestoes
   set autor_id = null, autor_nome = null
 where anonima = true
   and (autor_id is not null or autor_nome is not null);

-- 3) Tighten sugestoes insert: require authenticated user; non-anonymous must use own id
drop policy if exists "Authenticated users can insert" on public.sugestoes;
create policy "Authenticated users can insert"
  on public.sugestoes
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (anonima = true or autor_id = auth.uid())
  );

-- 4) Explicit read policy for levels-data bucket (object reads only; no listing semantics beyond bucket scope)
create policy "Public read levels-data"
  on storage.objects
  for select
  to public
  using (bucket_id = 'levels-data');
