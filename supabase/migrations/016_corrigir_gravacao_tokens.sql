-- Permite que tanto visitantes por codigo quanto o mestre autenticado movam
-- tokens. A RPC continua sendo a operacao principal e atomica.

grant select, update on public.tokens_mapa to anon, authenticated;

drop policy if exists "tabletop publico move tokens" on public.tokens_mapa;
drop policy if exists "tabletop move tokens" on public.tokens_mapa;
create policy "tabletop move tokens"
on public.tokens_mapa
for update
to anon, authenticated
using (true)
with check (true);

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
