-- 16_audit_logs.sql
-- Auditoría de acciones sensibles

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor text not null,
  entity_id text not null,
  entity_type text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

comment on table public.audit_logs is 'Registro de acciones sensibles del CRM';

-- TODO: agregar RLS y políticas por país/rol.
