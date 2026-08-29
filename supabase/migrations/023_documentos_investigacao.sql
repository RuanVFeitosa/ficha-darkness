-- Estrutura persistente para Evidencias e Itens do modo Investigacao.
create table if not exists public.documentos_investigacao (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas(id) on delete cascade,
  nome text not null,
  descricao text not null default '',
  categoria text not null default 'evidencia'
    check (categoria in ('evidencia', 'item')),
  mime_type text not null,
  arquivo_nome text not null,
  url text not null,
  storage_path text not null,
  visualizar_todos boolean not null default true,
  jogadores_visiveis jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists documentos_investigacao_campanha_idx
on public.documentos_investigacao(campanha_id, criado_em desc);

alter table public.documentos_investigacao enable row level security;
grant select, insert, update, delete on public.documentos_investigacao to anon;

drop policy if exists "mesa acessa documentos de investigacao"
on public.documentos_investigacao;
create policy "mesa acessa documentos de investigacao"
on public.documentos_investigacao
for all to anon using (true) with check (true);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'evidencias',
  'evidencias',
  true,
  26214400,
  array[
    'application/pdf',
    'image/webp',
    'image/jpeg',
    'image/png',
    'image/avif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on storage.objects to anon;

drop policy if exists "mesa le evidencias" on storage.objects;
create policy "mesa le evidencias"
on storage.objects for select to anon
using (bucket_id = 'evidencias');

drop policy if exists "mesa envia evidencias" on storage.objects;
create policy "mesa envia evidencias"
on storage.objects for insert to anon
with check (bucket_id = 'evidencias');

drop policy if exists "mesa atualiza evidencias" on storage.objects;
create policy "mesa atualiza evidencias"
on storage.objects for update to anon
using (bucket_id = 'evidencias')
with check (bucket_id = 'evidencias');

drop policy if exists "mesa remove evidencias" on storage.objects;
create policy "mesa remove evidencias"
on storage.objects for delete to anon
using (bucket_id = 'evidencias');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'documentos_investigacao'
  ) then
    alter publication supabase_realtime
      add table public.documentos_investigacao;
  end if;
end $$;
