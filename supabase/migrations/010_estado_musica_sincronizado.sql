alter table public.campanhas
add column if not exists musica_estado jsonb;

comment on column public.campanhas.musica_estado is
'Faixa, posicao e controles da musica sincronizados pelo mestre.';
