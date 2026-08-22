-- Cada ficha possui um unico token por campanha. As posicoes dos diferentes
-- mapas ja ficam guardadas na coluna JSONB `posicoes` desse mesmo token.

with tokens_duplicados as (
  select
    id,
    row_number() over (
      partition by campanha_id, ficha_id
      order by atualizado_em desc nulls last, id desc
    ) as ordem
  from public.tokens_mapa
  where ficha_id is not null
)
delete from public.tokens_mapa token
using tokens_duplicados duplicado
where token.id = duplicado.id
  and duplicado.ordem > 1;

create unique index if not exists tokens_mapa_campanha_ficha_unico
on public.tokens_mapa (campanha_id, ficha_id)
where ficha_id is not null;
