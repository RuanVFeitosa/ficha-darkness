update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp',
      'model/gltf-binary', 'model/gltf+json',
      'application/json', 'application/octet-stream',
      'image/ktx2', 'image/basis'
    ]
where id = 'mapas';
