alter table public.campanhas
add column if not exists musicas jsonb not null default '[]'::jsonb;

comment on column public.campanhas.musicas is
'Playlist manual da campanha com URL, nome e capa de cada musica.';
