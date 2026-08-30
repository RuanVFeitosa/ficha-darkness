-- A mesa acessa campanhas por codigo e nao depende de uma sessao Supabase.
create table if not exists public.anotacoes_campanha (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  titulo text not null default 'Sem titulo',
  pasta text not null default 'Notas',
  conteudo text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.anotacoes_campanha
add column if not exists documento_url text,
add column if not exists documento_nome text,
add column if not exists documento_tipo text;

create table if not exists public.pastas_anotacoes (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now(),
  unique (campanha_id, nome)
);

create index if not exists anotacoes_campanha_pasta_idx
on public.anotacoes_campanha(campanha_id, pasta);

alter table public.anotacoes_campanha enable row level security;
alter table public.pastas_anotacoes enable row level security;

grant select, insert, update, delete on public.anotacoes_campanha to anon, authenticated;
grant select, insert, update, delete on public.pastas_anotacoes to anon, authenticated;

drop policy if exists "mestre gerencia anotacoes da campanha" on public.anotacoes_campanha;
drop policy if exists "mesa gerencia anotacoes da campanha" on public.anotacoes_campanha;
create policy "mesa gerencia anotacoes da campanha"
on public.anotacoes_campanha for all to anon, authenticated
using (true) with check (true);

drop policy if exists "mestre gerencia pastas das anotacoes" on public.pastas_anotacoes;
drop policy if exists "mesa gerencia pastas das anotacoes" on public.pastas_anotacoes;
create policy "mesa gerencia pastas das anotacoes"
on public.pastas_anotacoes for all to anon, authenticated
using (true) with check (true);
