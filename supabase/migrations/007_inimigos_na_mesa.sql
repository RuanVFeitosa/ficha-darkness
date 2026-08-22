create table if not exists public.inimigos_campanha (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  inimigo_ref text not null,
  nome text not null,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  unique (campanha_id, inimigo_ref)
);

alter table public.inimigos_campanha enable row level security;

create policy "mestre gerencia inimigos da campanha"
on public.inimigos_campanha
for all
using (exists(select 1 from public.campanhas c where c.id = campanha_id and c.mestre_id = auth.uid()))
with check (exists(select 1 from public.campanhas c where c.id = campanha_id and c.mestre_id = auth.uid()));

alter publication supabase_realtime add table public.inimigos_campanha;
