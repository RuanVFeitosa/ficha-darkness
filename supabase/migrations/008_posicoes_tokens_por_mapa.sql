alter table public.tokens_mapa
add column if not exists posicoes jsonb not null default '{}'::jsonb;

comment on column public.tokens_mapa.posicoes is
'Posicoes do token indexadas por cena e mapa de batalha.';
