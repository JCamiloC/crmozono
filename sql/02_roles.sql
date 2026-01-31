-- 02_roles.sql
-- Catálogo de roles del sistema

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

comment on table public.roles is 'Roles del sistema: superadmin, admin, agente';
