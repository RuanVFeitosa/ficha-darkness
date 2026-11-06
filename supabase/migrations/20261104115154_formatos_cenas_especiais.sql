-- Preserve existing permissions and formats, including 3D assets and audio.
-- Migration 036 replaced the list previously expanded by migration 030.
update storage.buckets
set allowed_mime_types = case
  when allowed_mime_types is null then null
  else array(
    select distinct mime from unnest(allowed_mime_types || array[
      'image/gif', 'image/png', 'image/apng', 'image/jpeg', 'image/webp',
      'image/avif', 'image/bmp', 'image/x-ms-bmp', 'image/x-icon', 'image/vnd.microsoft.icon',
      'video/mp4', 'video/webm'
    ]::text[]) as formats(mime)
  ) end,
  file_size_limit = case when file_size_limit is null then null
    else greatest(file_size_limit, 26214400) end
where id = 'mapas';
