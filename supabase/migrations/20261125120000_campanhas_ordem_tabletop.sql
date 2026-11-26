alter table public.campanhas
  drop constraint if exists campanhas_sistema_check,
  add constraint campanhas_sistema_check check (sistema in ('absoluto', 'espiral', 'ordem'));

create or replace function public.validar_sistema_ficha_campanha()
returns trigger language plpgsql security invoker set search_path = public as $$
declare
  sistema_campanha text;
  sistema_ficha text;
begin
  select sistema into sistema_campanha from public.campanhas where id = new.campanha_id for update;
  sistema_ficha := case
    when new.ficha_id like 'ordem:%' then 'ordem'
    when new.ficha_id like 'espiral:%' then 'espiral'
    else 'absoluto'
  end;
  if new.ficha_id is not null and sistema_ficha <> sistema_campanha then
    raise exception 'Esta ficha pertence a outro sistema.';
  end if;
  return new;
end;
$$;

create or replace function public.validar_troca_sistema_campanha()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.sistema is distinct from old.sistema and exists (
    select 1 from public.membros_campanha
    where campanha_id = new.id and ficha_id is not null
      and (case when ficha_id like 'ordem:%' then 'ordem'
                when ficha_id like 'espiral:%' then 'espiral'
                else 'absoluto' end) <> new.sistema
  ) then
    raise exception 'Desvincule as fichas de outro sistema antes de alterar o sistema da campanha.';
  end if;
  return new;
end;
$$;

create function public.restringir_criacao_tabletop_3d()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and new.tabletop_tipo = '3d' then
    if tg_op = 'INSERT' or old.tabletop_tipo is distinct from new.tabletop_tipo then
      raise exception 'O Tabletop 3D é exclusivo do proprietário.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger restringir_criacao_tabletop_3d
before insert or update of tabletop_tipo on public.campanhas
for each row execute function public.restringir_criacao_tabletop_3d();
