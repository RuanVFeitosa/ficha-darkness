-- O dashboard atual usa um codigo local de mestre e nao cria uma conta no
-- Supabase Auth. Libera as operacoes administrativas usadas por esse painel.

grant all on public.campanhas, public.cenas, public.membros_campanha,
  public.tokens_mapa, public.rolagens, public.inimigos_campanha to anon;

drop policy if exists "painel por codigo gerencia campanhas" on public.campanhas;
create policy "painel por codigo gerencia campanhas" on public.campanhas
for all to anon using (true) with check (true);

drop policy if exists "painel por codigo gerencia cenas" on public.cenas;
create policy "painel por codigo gerencia cenas" on public.cenas
for all to anon using (true) with check (true);

drop policy if exists "painel por codigo gerencia membros" on public.membros_campanha;
create policy "painel por codigo gerencia membros" on public.membros_campanha
for all to anon using (true) with check (true);

drop policy if exists "painel por codigo gerencia tokens" on public.tokens_mapa;
create policy "painel por codigo gerencia tokens" on public.tokens_mapa
for all to anon using (true) with check (true);

drop policy if exists "painel por codigo gerencia rolagens" on public.rolagens;
create policy "painel por codigo gerencia rolagens" on public.rolagens
for all to anon using (true) with check (true);

drop policy if exists "painel por codigo gerencia inimigos" on public.inimigos_campanha;
create policy "painel por codigo gerencia inimigos" on public.inimigos_campanha
for all to anon using (true) with check (true);

grant select, insert, update, delete on storage.objects to anon;

drop policy if exists "painel por codigo envia mapas" on storage.objects;
create policy "painel por codigo envia mapas" on storage.objects
for insert to anon with check (bucket_id = 'mapas');

drop policy if exists "painel por codigo atualiza mapas" on storage.objects;
create policy "painel por codigo atualiza mapas" on storage.objects
for update to anon using (bucket_id = 'mapas') with check (bucket_id = 'mapas');

drop policy if exists "painel por codigo remove mapas" on storage.objects;
create policy "painel por codigo remove mapas" on storage.objects
for delete to anon using (bucket_id = 'mapas');
