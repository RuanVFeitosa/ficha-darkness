alter table public.anotacoes_campanha
add column if not exists documento_url text,
add column if not exists documento_nome text,
add column if not exists documento_tipo text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos-campanha', 'documentos-campanha', true, 26214400,
  array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "documentos de campanha publicos" on storage.objects for select using (bucket_id = 'documentos-campanha');
create policy "mestres enviam documentos de campanha" on storage.objects for insert to authenticated with check (
  bucket_id = 'documentos-campanha' and exists (
    select 1 from public.campanhas c
    where c.id::text = (storage.foldername(name))[1] and c.mestre_id = auth.uid()
  )
);
create policy "mestres removem documentos de campanha" on storage.objects for delete to authenticated using (
  bucket_id = 'documentos-campanha' and exists (
    select 1 from public.campanhas c
    where c.id::text = (storage.foldername(name))[1] and c.mestre_id = auth.uid()
  )
);
