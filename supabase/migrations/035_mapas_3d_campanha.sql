alter table public.campanhas
add column if not exists mapas_3d jsonb not null default '[]'::jsonb;

comment on column public.campanhas.mapas_3d is
'Mapas construidos no editor 3D, com nome e instancias de assets posicionadas.';
