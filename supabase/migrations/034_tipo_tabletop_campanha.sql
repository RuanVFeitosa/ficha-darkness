alter table public.campanhas
add column if not exists tabletop_tipo text not null default '2d'
check (tabletop_tipo in ('2d', '3d'));

comment on column public.campanhas.tabletop_tipo is
'Define qual interface de tabletop a campanha abre por padrao: 2d ou 3d.';
