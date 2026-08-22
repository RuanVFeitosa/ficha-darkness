-- Mantem condicoes e demais alteracoes das fichas sincronizadas no tabletop.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'personagens'
  ) then
    alter publication supabase_realtime add table public.personagens;
  end if;
end $$;
