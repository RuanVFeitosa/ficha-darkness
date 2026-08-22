-- Jogadores entram pelo codigo da ficha, sem criar uma sessao Supabase.
-- Estas politicas liberam apenas a superficie usada pelo tabletop.

create policy "tabletop publico le campanhas"
on public.campanhas for select
to anon
using (true);

create policy "tabletop publico le membros"
on public.membros_campanha for select
to anon
using (true);

create policy "tabletop publico le cenas"
on public.cenas for select
to anon
using (true);

create policy "tabletop publico le tokens"
on public.tokens_mapa for select
to anon
using (true);

create policy "tabletop publico move tokens"
on public.tokens_mapa for update
to anon
using (true)
with check (true);

create policy "tabletop publico le rolagens"
on public.rolagens for select
to anon
using (true);

create policy "tabletop publico cria rolagens"
on public.rolagens for insert
to anon
with check (campanha_id is not null);

create policy "tabletop publico le inimigos"
on public.inimigos_campanha for select
to anon
using (true);
