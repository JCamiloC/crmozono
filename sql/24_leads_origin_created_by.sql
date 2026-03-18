-- 24_leads_origin_created_by.sql
-- Trazabilidad de origen y creador del lead

alter table public.leads
  add column if not exists origen text;

alter table public.leads
  add column if not exists created_by uuid;

alter table public.leads
  alter column origen set default 'manual';

update public.leads
set origen = 'manual'
where origen is null;

create index if not exists leads_origen_idx
  on public.leads (origen);

comment on column public.leads.origen is 'Origen del lead: whatsapp, facebook_ads, manual, campaign';
comment on column public.leads.created_by is 'Usuario que creó el lead cuando aplica';
