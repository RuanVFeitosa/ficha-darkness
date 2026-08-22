create table if not exists public.pastas_anotacoes (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now(),
  unique(campanha_id, nome)
);
alter table public.pastas_anotacoes enable row level security;
create policy "mestre gerencia pastas das anotacoes" on public.pastas_anotacoes for all
using (exists(select 1 from public.campanhas c where c.id = campanha_id and c.mestre_id = auth.uid()))
with check (exists(select 1 from public.campanhas c where c.id = campanha_id and c.mestre_id = auth.uid()));
