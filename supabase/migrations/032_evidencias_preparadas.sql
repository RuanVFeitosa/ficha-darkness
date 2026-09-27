-- Permite que o mestre monte evidencias com antecedencia sem revela-las.
alter table public.documentos_investigacao
add column if not exists revelada boolean not null default true;

update public.documentos_investigacao
set revelada = true
where revelada is null;

notify pgrst, 'reload schema';
