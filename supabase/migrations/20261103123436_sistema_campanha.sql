alter table public.campanhas
  add column if not exists sistema text not null default 'absoluto'
  check (sistema in ('absoluto', 'espiral'));

-- Preserve campaigns whose existing sheets are exclusively ESPIRAL.
update public.campanhas c set sistema = 'espiral'
where exists (select 1 from public.membros_campanha m where m.campanha_id = c.id and m.ficha_id like 'espiral:%')
and not exists (select 1 from public.membros_campanha m where m.campanha_id = c.id and m.ficha_id is not null and m.ficha_id not like 'espiral:%');

create or replace function public.validar_sistema_ficha_campanha()
returns trigger language plpgsql security invoker set search_path = public as $$
declare sistema_campanha text;
begin
  select sistema into sistema_campanha from public.campanhas where id = new.campanha_id for update;
  if new.ficha_id is not null and
    ((new.ficha_id like 'espiral:%') <> (sistema_campanha = 'espiral')) then
    raise exception 'Esta ficha pertence a outro sistema.';
  end if;
  return new;
end;
$$;

create trigger validar_sistema_ficha_campanha
before insert or update of ficha_id, campanha_id on public.membros_campanha
for each row execute function public.validar_sistema_ficha_campanha();

create or replace function public.validar_troca_sistema_campanha()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.sistema is distinct from old.sistema and exists (
    select 1 from public.membros_campanha
    where campanha_id = new.id and ficha_id is not null
    and ((ficha_id like 'espiral:%') <> (new.sistema = 'espiral'))
  ) then
    raise exception 'Desvincule as fichas de outro sistema antes de alterar o sistema da campanha.';
  end if;
  return new;
end;
$$;

create trigger validar_troca_sistema_campanha
before update of sistema on public.campanhas
for each row execute function public.validar_troca_sistema_campanha();
