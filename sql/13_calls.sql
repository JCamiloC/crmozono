-- 13_calls.sql
-- Registro de llamadas comerciales

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  agent_id uuid,
  agent_name text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_minutes integer not null default 0,
  result text not null check (result in ('venta', 'interesado', 'no_interesado', 'no_contesta', 'cortada', 'numero_incorrecto')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists calls_lead_id_idx
  on public.calls (lead_id, started_at desc);

comment on table public.calls is 'Historial de llamadas asociadas a leads';

-- TODO: agregar RLS y políticas por país/rol.
