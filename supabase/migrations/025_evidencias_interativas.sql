-- Evidencias Interativas sao registros separados de arquivos e itens comuns.
alter table public.documentos_investigacao
drop constraint if exists documentos_investigacao_categoria_check;

alter table public.documentos_investigacao
add constraint documentos_investigacao_categoria_check
check (categoria in ('evidencia', 'item', 'interativa'));

notify pgrst, 'reload schema';
