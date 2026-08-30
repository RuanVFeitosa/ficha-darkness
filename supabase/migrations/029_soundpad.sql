alter table public.campanhas
add column if not exists soundpad jsonb not null default '[]'::jsonb,
add column if not exists soundpad_estado jsonb not null default '{"ativos":{}}'::jsonb;

comment on column public.campanhas.soundpad is 'Biblioteca de efeitos rapidos e ambientes da campanha.';
comment on column public.campanhas.soundpad_estado is 'Sons ativos do soundpad sincronizados com a mesa.';
