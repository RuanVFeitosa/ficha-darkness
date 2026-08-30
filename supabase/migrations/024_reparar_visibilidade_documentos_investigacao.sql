-- Atualiza tabelas de documentos de investigacao criadas por versoes antigas.
alter table public.documentos_investigacao
add column if not exists visualizar_todos boolean not null default true,
add column if not exists jogadores_visiveis jsonb not null default '[]'::jsonb;

update public.documentos_investigacao
set jogadores_visiveis = '[]'::jsonb
where jogadores_visiveis is null;

-- Solicita ao PostgREST que atualize o cache do schema imediatamente.
notify pgrst, 'reload schema';
