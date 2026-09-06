alter table public.cenas
add column if not exists visualizar_todos boolean not null default true,
add column if not exists jogadores_visiveis text[] not null default '{}'::text[];

comment on column public.cenas.visualizar_todos is
  'Define se todos os jogadores vinculados podem ver a cena quando ela estiver ativa.';

comment on column public.cenas.jogadores_visiveis is
  'IDs das fichas autorizadas quando visualizar_todos for falso.';
