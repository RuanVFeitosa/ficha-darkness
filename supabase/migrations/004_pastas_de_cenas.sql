alter table public.cenas
add column if not exists pasta text not null default 'Sem pasta';

create index if not exists cenas_campanha_pasta_ordem_idx
on public.cenas (campanha_id, pasta, ordem);
