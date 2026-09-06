-- O bucket mapas tambem recebe audios e midias especiais das campanhas.
-- Preserva tipos adicionais e limites maiores configurados no ambiente.
update storage.buckets
set allowed_mime_types = case
      when allowed_mime_types is null then null
      else array(
        select distinct mime
        from unnest(allowed_mime_types || array[
          'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
          'video/mp4', 'video/webm',
          'audio/mpeg', 'audio/mp3', 'audio/x-mp3',
          'audio/ogg', 'audio/opus', 'application/ogg',
          'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave',
          'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/m4a',
          'audio/aac', 'audio/x-aac', 'audio/flac', 'audio/x-flac'
        ]::text[]) as tipos(mime)
      )
    end,
    file_size_limit = case when file_size_limit is null then null
      else greatest(file_size_limit, 26214400) end
where id = 'mapas';
