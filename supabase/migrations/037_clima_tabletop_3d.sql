alter table public.campanhas
  add column if not exists clima_3d jsonb not null default '{"preset":"dia","label":"Dia","skyColor":"#7db9df","fogColor":"#bfd9e5","sunColor":"#fff0bd","cloudColor":"#f4f7f6","ambient":0.92,"sun":2.05,"sunSize":1.05,"sunPosition":[11,14,-25],"clouds":0.22,"fogNear":20,"fogFar":75,"rain":0,"snow":0,"wind":0.12}'::jsonb;

comment on column public.campanhas.clima_3d is
  'Configuracao sincronizada de clima e atmosfera do tabletop 3D.';
