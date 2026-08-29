-- Reparo idempotente para ambientes em que as migrations 009/010
-- nao foram aplicadas antes da publicacao do editor de playlist.
alter table public.campanhas
add column if not exists musicas jsonb not null default '[]'::jsonb;

alter table public.campanhas
add column if not exists musica_estado jsonb;

comment on column public.campanhas.musicas is
'Playlist manual da campanha com URL, nome e capa de cada musica.';

comment on column public.campanhas.musica_estado is
'Faixa, posicao e controles da musica sincronizados pelo mestre.';

update public.campanhas
set musicas = '[]'::jsonb
where musicas is null;
