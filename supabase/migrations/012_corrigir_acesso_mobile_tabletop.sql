-- Garante acesso do navegador do jogador, que nao possui sessao Supabase.

grant select on public.campanhas, public.membros_campanha, public.cenas,
  public.tokens_mapa, public.rolagens, public.inimigos_campanha to anon;
grant update on public.tokens_mapa to anon;
grant insert on public.rolagens to anon;

drop policy if exists "tabletop publico le campanhas" on public.campanhas;
create policy "tabletop publico le campanhas" on public.campanhas
for select to anon using (true);

drop policy if exists "tabletop publico le membros" on public.membros_campanha;
create policy "tabletop publico le membros" on public.membros_campanha
for select to anon using (true);

drop policy if exists "tabletop publico le cenas" on public.cenas;
create policy "tabletop publico le cenas" on public.cenas
for select to anon using (true);

drop policy if exists "tabletop publico le tokens" on public.tokens_mapa;
create policy "tabletop publico le tokens" on public.tokens_mapa
for select to anon using (true);

drop policy if exists "tabletop publico move tokens" on public.tokens_mapa;
create policy "tabletop publico move tokens" on public.tokens_mapa
for update to anon using (true) with check (true);

drop policy if exists "tabletop publico le rolagens" on public.rolagens;
create policy "tabletop publico le rolagens" on public.rolagens
for select to anon using (true);

drop policy if exists "tabletop publico cria rolagens" on public.rolagens;
create policy "tabletop publico cria rolagens" on public.rolagens
for insert to anon with check (campanha_id is not null);

drop policy if exists "tabletop publico le inimigos" on public.inimigos_campanha;
create policy "tabletop publico le inimigos" on public.inimigos_campanha
for select to anon using (true);
