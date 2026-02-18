-- 15_campaign_logs.sql
-- Logs por destinatario en campañas

create table if not exists public.campaign_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  phone text not null,
  status text not null check (status in ('enviado', 'fallido', 'bloqueado')),
  created_at timestamptz not null default now()
);

create index if not exists campaign_logs_campaign_id_idx
  on public.campaign_logs (campaign_id, created_at desc);

comment on table public.campaign_logs is 'Detalle de envío por teléfono en campañas';

-- TODO: agregar RLS y políticas por país/rol.
