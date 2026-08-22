-- Garante que as tabelas compartilhadas emitam eventos para outras telas.

alter table public.tokens_mapa replica identity full;
alter table public.campanhas replica identity full;
alter table public.cenas replica identity full;
alter table public.membros_campanha replica identity full;
alter table public.rolagens replica identity full;

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'campanhas',
    'tokens_mapa',
    'cenas',
    'membros_campanha',
    'rolagens'
  ] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tabela
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tabela);
    end if;
  end loop;
end
$$;
