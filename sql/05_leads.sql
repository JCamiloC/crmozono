-- 05_leads.sql
-- Tabla de leads (base)

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  telefono text not null,
  pais text not null,
  administrador_id uuid not null,
  agente_id uuid not null,
  estado_actual text not null,
  fecha_estado timestamptz not null default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.leads is 'Leads del CRM (base)';
comment on column public.leads.estado_actual is 'Estado actual del lead (ver docs/05-estados-leads.md)';

-- TODO: agregar RLS y políticas por país/rol.
