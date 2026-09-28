-- Separa o conteudo pesado do PC da listagem geral de evidencias.
create table if not exists public.conteudos_computador (
  documento_id uuid primary key
    references public.documentos_investigacao(id) on delete cascade,
  campanha_id uuid not null
    references public.campanhas(id) on delete cascade,
  conteudo jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

create index if not exists conteudos_computador_campanha_idx
on public.conteudos_computador(campanha_id);

insert into public.conteudos_computador (
  documento_id,
  campanha_id,
  conteudo,
  atualizado_em
)
select
  id,
  campanha_id,
  conteudo_interativo,
  now()
from public.documentos_investigacao
where conteudo_interativo is not null
on conflict (documento_id) do update set
  conteudo = excluded.conteudo,
  atualizado_em = excluded.atualizado_em;

-- Evita que consultas e eventos da lista de documentos transportem as imagens.
update public.documentos_investigacao
set conteudo_interativo = null
where conteudo_interativo is not null;

alter table public.conteudos_computador enable row level security;
grant select, insert, update, delete on public.conteudos_computador to anon;

drop policy if exists "mesa acessa conteudo dos computadores"
on public.conteudos_computador;
create policy "mesa acessa conteudo dos computadores"
on public.conteudos_computador
for all to anon using (true) with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conteudos_computador'
  ) then
    alter publication supabase_realtime
      add table public.conteudos_computador;
  end if;
end $$;

notify pgrst, 'reload schema';
