create table if not exists public.anotacoes_campanha (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  titulo text not null default 'Sem titulo',
  pasta text not null default 'Notas',
  conteudo text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists anotacoes_campanha_pasta_idx on public.anotacoes_campanha(campanha_id, pasta);
alter table public.anotacoes_campanha enable row level security;

create policy "mestre gerencia anotacoes da campanha"
on public.anotacoes_campanha for all
using (exists(select 1 from public.campanhas c where c.id = campanha_id and c.mestre_id = auth.uid()))
with check (exists(select 1 from public.campanhas c where c.id = campanha_id and c.mestre_id = auth.uid()));
