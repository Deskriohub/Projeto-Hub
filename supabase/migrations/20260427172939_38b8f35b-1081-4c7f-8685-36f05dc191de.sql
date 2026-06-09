create table public.elogios (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now() not null,
  remetente_id uuid references auth.users(id) on delete cascade not null,
  remetente_nome text not null,
  destinatario_id uuid references auth.users(id) on delete cascade not null,
  destinatario_nome text not null,
  mensagem text not null,
  emoji text not null,
  publico boolean default true not null
);

alter table public.elogios enable row level security;

create policy "Authenticated users can insert" on public.elogios
  for insert to authenticated with check (auth.uid() = remetente_id);

create policy "Public elogios visible to all" on public.elogios
  for select to authenticated using (publico = true);

create policy "Private elogios visible to sender and recipient" on public.elogios
  for select to authenticated using (
    publico = false and (auth.uid() = remetente_id or auth.uid() = destinatario_id)
  );

create policy "Sender recipient and admin can delete" on public.elogios
  for delete to authenticated using (
    auth.uid() = remetente_id or auth.uid() = destinatario_id or has_role(auth.uid(), 'admin'::app_role)
  );

create index elogios_created_at_idx on public.elogios (created_at desc);
create index elogios_remetente_idx on public.elogios (remetente_id);
create index elogios_destinatario_idx on public.elogios (destinatario_id);