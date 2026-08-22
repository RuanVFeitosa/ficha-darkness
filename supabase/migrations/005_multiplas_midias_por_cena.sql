alter table public.cenas
add column if not exists imagens_cena jsonb not null default '[]'::jsonb,
add column if not exists mapas_batalha jsonb not null default '[]'::jsonb;

alter table public.campanhas
add column if not exists midia_ativa_id text;

update public.cenas
set imagens_cena = jsonb_build_array(jsonb_build_object(
  'id', 'cena-' || id::text || '-1', 'nome', 'Cena principal', 'url', imagem_url
))
where imagem_url is not null and jsonb_array_length(imagens_cena) = 0;

update public.cenas
set mapas_batalha = jsonb_build_array(jsonb_build_object(
  'id', 'mapa-' || id::text || '-1', 'nome', 'Mapa principal', 'url', mapa_url,
  'larguraGrade', largura_grade, 'alturaGrade', altura_grade
))
where mapa_url is not null and jsonb_array_length(mapas_batalha) = 0;
