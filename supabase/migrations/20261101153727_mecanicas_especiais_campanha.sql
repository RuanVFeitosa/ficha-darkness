-- Shared state for special session mechanics in both tabletop renderers.
-- Uses the existing campaign access policies (code-based access).
alter table public.campanhas
  add column if not exists mecanicas_especiais jsonb not null
  default '{"version":1,"revision":0,"events":[],"activeId":null}'::jsonb;

alter table public.campanhas
  add constraint campanhas_mecanicas_especiais_shape check (
    jsonb_typeof(mecanicas_especiais) = 'object'
    and mecanicas_especiais ?& array['version','revision','events','activeId']
    and mecanicas_especiais @> '{"version":1}'::jsonb
    and jsonb_typeof(mecanicas_especiais->'events') = 'array'
    and jsonb_array_length(mecanicas_especiais->'events') <= 30
    and jsonb_typeof(mecanicas_especiais->'revision') = 'number'
    and (mecanicas_especiais->>'revision')::numeric >= 0
    and octet_length(mecanicas_especiais::text) <= 262144
  );

comment on column public.campanhas.mecanicas_especiais is
  'Versioned campaign mechanics: prepared events, active event, objectives, counters and history. Compare revision when updating to avoid lost writes. Do not store secret GM notes here.';
