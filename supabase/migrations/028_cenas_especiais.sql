alter table public.cenas
add column if not exists cena_especial jsonb;

comment on column public.cenas.cena_especial is
  'Midia, trilha e transicao usadas na apresentacao cinematica em tela cheia.';
