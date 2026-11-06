-- Shared combat cursor; uses the existing campaign access policies and realtime publication.
alter table public.campanhas add column if not exists turno_combate jsonb;
