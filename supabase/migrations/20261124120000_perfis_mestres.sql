create table public.darkness_mestres (
  id uuid primary key,
  nome text not null check (char_length(nome) between 1 and 80),
  codigo_hash text not null unique check (codigo_hash ~ '^[a-f0-9]{64}$'),
  criado_em timestamptz not null default now()
);

alter table public.darkness_mestres enable row level security;
revoke all on table public.darkness_mestres from public, anon, authenticated;
grant select, insert on table public.darkness_mestres to service_role;

create index darkness_mestres_lista on public.darkness_mestres (criado_em desc, id);
