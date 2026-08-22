insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mapas', 'mapas', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "imagens de mapas publicas" on storage.objects for select using (bucket_id = 'mapas');
create policy "mestres enviam mapas" on storage.objects for insert to authenticated with check (
  bucket_id = 'mapas' and exists (
    select 1 from public.campanhas c
    where c.id::text = (storage.foldername(name))[1] and c.mestre_id = auth.uid()
  )
);
create policy "mestres atualizam mapas" on storage.objects for update to authenticated using (
  bucket_id = 'mapas' and exists (
    select 1 from public.campanhas c
    where c.id::text = (storage.foldername(name))[1] and c.mestre_id = auth.uid()
  )
);
create policy "mestres removem mapas" on storage.objects for delete to authenticated using (
  bucket_id = 'mapas' and exists (
    select 1 from public.campanhas c
    where c.id::text = (storage.foldername(name))[1] and c.mestre_id = auth.uid()
  )
);

alter publication supabase_realtime add table public.cenas;
