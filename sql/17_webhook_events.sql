-- 17_webhook_events.sql
-- Registro de eventos webhook recibidos desde proveedores externos

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  message_id text,
  phone text,
  payload_original jsonb not null,
  processed boolean not null default false,
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists webhook_events_provider_created_idx
  on public.webhook_events (provider, created_at desc);

create index if not exists webhook_events_message_id_idx
  on public.webhook_events (message_id);

comment on table public.webhook_events is 'Eventos recibidos por webhooks para trazabilidad y reprocesamiento';

-- TODO: agregar RLS y políticas por país/rol.
