-- 06_lead_status_history.sql
-- Historial de estados de leads

create table if not exists public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  estado text not null,
  fecha timestamptz not null default now(),
  usuario_id uuid not null
);

comment on table public.lead_status_history is 'Historial de cambios de estado de leads';

-- TODO: agregar RLS y políticas por país/rol.
