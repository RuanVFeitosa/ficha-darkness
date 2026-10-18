-- Apenas o backend com service_role acessa o conteúdo integral dos murais.
-- A API verifica o perfil/vínculo e filtra pistas ocultas antes de responder.
create table if not exists public.murais_investigacao (
  id text primary key check (id ~ '^[a-f0-9]{64}$'),
  conteudo jsonb not null check (jsonb_typeof(conteudo) = 'object'),
  revisao bigint not null default 0 check (revisao >= 0),
  atualizado_em timestamptz not null default now()
);

alter table public.murais_investigacao enable row level security;
revoke all on public.murais_investigacao from public, anon, authenticated;
grant select, insert, update, delete on public.murais_investigacao to service_role;
