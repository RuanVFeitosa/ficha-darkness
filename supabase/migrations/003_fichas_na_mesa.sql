create policy "mestre gerencia membros" on public.membros_campanha
for all to authenticated
using (exists(select 1 from public.campanhas c where c.id = campanha_id and c.mestre_id = auth.uid()))
with check (exists(select 1 from public.campanhas c where c.id = campanha_id and c.mestre_id = auth.uid()));

alter publication supabase_realtime add table public.membros_campanha;
