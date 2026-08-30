alter table public.cenas
add column if not exists loja_disponivel boolean not null default false;
