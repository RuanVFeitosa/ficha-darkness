drop policy if exists "jogador move proprio token" on public.tokens_mapa;

create policy "jogador move proprio token"
on public.tokens_mapa
for update
using (
  exists (
    select 1
    from public.membros_campanha membro
    where membro.campanha_id = tokens_mapa.campanha_id
      and membro.ficha_id = tokens_mapa.ficha_id
      and membro.usuario_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.membros_campanha membro
    where membro.campanha_id = tokens_mapa.campanha_id
      and membro.ficha_id = tokens_mapa.ficha_id
      and membro.usuario_id = auth.uid()
  )
);
