create extension if not exists pgcrypto;

create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo ~ '^[A-Z0-9]{6,10}$'),
  nome text not null,
  mestre_id uuid references auth.users(id) on delete set null,
  modo text not null default 'cena' check (modo in ('cena', 'mapa')),
  cena_ativa_id uuid,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.cenas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  imagem_url text,
  mapa_url text,
  largura_grade integer not null default 12 check (largura_grade between 1 and 100),
  altura_grade integer not null default 8 check (altura_grade between 1 and 100),
  ordem integer not null default 0
);
alter table public.campanhas drop constraint if exists campanhas_cena_ativa_id_fkey;
alter table public.campanhas add constraint campanhas_cena_ativa_id_fkey foreign key (cena_ativa_id) references public.cenas(id) on delete set null;

create table if not exists public.membros_campanha (
  id uuid primary key default gen_random_uuid(), campanha_id uuid not null references public.campanhas(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete cascade, ficha_id text not null, nome text not null,
  papel text not null default 'jogador' check (papel in ('mestre','jogador')), criado_em timestamptz not null default now(),
  unique (campanha_id, ficha_id)
);
create table if not exists public.tokens_mapa (
  id uuid primary key default gen_random_uuid(), campanha_id uuid not null references public.campanhas(id) on delete cascade,
  cena_id uuid references public.cenas(id) on delete cascade, ficha_id text, nome text not null, imagem_url text,
  x numeric(6,3) not null default 50 check (x between 0 and 100), y numeric(6,3) not null default 50 check (y between 0 and 100),
  visivel boolean not null default true, atualizado_em timestamptz not null default now()
);
create table if not exists public.rolagens (
  id uuid primary key default gen_random_uuid(), campanha_id uuid not null references public.campanhas(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null, autor_nome text not null, expressao text not null,
  resultado integer not null, detalhes jsonb not null default '{}'::jsonb, criado_em timestamptz not null default now()
);

alter table public.campanhas enable row level security;
alter table public.cenas enable row level security;
alter table public.membros_campanha enable row level security;
alter table public.tokens_mapa enable row level security;
alter table public.rolagens enable row level security;

create or replace function public.participa_da_campanha(alvo uuid) returns boolean language sql security definer set search_path = public stable as $$
  select exists(select 1 from public.membros_campanha where campanha_id = alvo and usuario_id = auth.uid());
$$;
create policy "membros leem campanhas" on public.campanhas for select using (mestre_id = auth.uid() or public.participa_da_campanha(id));
create policy "mestre gerencia campanha" on public.campanhas for all using (mestre_id = auth.uid()) with check (mestre_id = auth.uid());
create policy "membros leem cenas" on public.cenas for select using (public.participa_da_campanha(campanha_id) or exists(select 1 from campanhas c where c.id=campanha_id and c.mestre_id=auth.uid()));
create policy "mestre gerencia cenas" on public.cenas for all using (exists(select 1 from campanhas c where c.id=campanha_id and c.mestre_id=auth.uid()));
create policy "membros visiveis" on public.membros_campanha for select using (public.participa_da_campanha(campanha_id) or usuario_id=auth.uid());
create policy "membros leem tokens" on public.tokens_mapa for select using (public.participa_da_campanha(campanha_id) or exists(select 1 from campanhas c where c.id=campanha_id and c.mestre_id=auth.uid()));
create policy "mestre move tokens" on public.tokens_mapa for all using (exists(select 1 from campanhas c where c.id=campanha_id and c.mestre_id=auth.uid()));
create policy "membros leem rolagens" on public.rolagens for select using (public.participa_da_campanha(campanha_id) or exists(select 1 from campanhas c where c.id=campanha_id and c.mestre_id=auth.uid()));
create policy "membros criam rolagens" on public.rolagens for insert with check (usuario_id=auth.uid() and public.participa_da_campanha(campanha_id));

alter publication supabase_realtime add table public.campanhas, public.tokens_mapa, public.rolagens;
