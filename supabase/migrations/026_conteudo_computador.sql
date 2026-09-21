-- Conteúdo por evidência, com as mesmas políticas de acesso do documento.
alter table public.documentos_investigacao
add column if not exists conteudo_interativo jsonb;
notify pgrst, 'reload schema';
