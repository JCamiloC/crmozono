-- 14_campaigns.sql
-- Campañas masivas de WhatsApp

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segment text not null,
  status text not null check (status in ('draft', 'scheduled', 'running', 'completed', 'paused')),
  scheduled_at timestamptz not null,
  total_recipients integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  delivery_rate numeric(5,2) not null default 0,
  message_preview text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_scheduled_at_idx
  on public.campaigns (scheduled_at desc);

comment on table public.campaigns is 'Campañas de mensajería masiva';

-- TODO: agregar RLS y políticas por país/rol.
