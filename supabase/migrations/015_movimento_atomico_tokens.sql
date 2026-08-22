-- Salva a posicao principal e a posicao especifica do mapa em uma unica
-- operacao, devolvendo a linha para o cliente confirmar a gravacao.

create or replace function public.mover_token_tabletop(
  token_alvo uuid,
  nova_x numeric,
  nova_y numeric,
  mapa_chave text
)
returns setof public.tokens_mapa
language plpgsql
security definer
set search_path = public
as $$
begin
  if nova_x < 0 or nova_x > 100 or nova_y < 0 or nova_y > 100 then
    raise exception 'Posicao do token fora dos limites do mapa';
  end if;

  return query
  update public.tokens_mapa
  set x = nova_x,
      y = nova_y,
      posicoes = coalesce(posicoes, '{}'::jsonb) || jsonb_build_object(
        coalesce(nullif(mapa_chave, ''), 'mapa-principal'),
        jsonb_build_object('x', nova_x, 'y', nova_y)
      ),
      atualizado_em = now()
  where id = token_alvo
  returning *;
end;
$$;

revoke all on function public.mover_token_tabletop(uuid, numeric, numeric, text) from public;
grant execute on function public.mover_token_tabletop(uuid, numeric, numeric, text) to anon, authenticated;
