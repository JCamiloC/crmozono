-- 18_seed_colombia_assignments.sql
-- Configuración de pruebas para Colombia.
-- IMPORTANTE:
-- 1) auth.users NO se debe insertar por SQL.
-- 2) Primero crea usuarios en Supabase Auth (Dashboard > Authentication > Users).
-- 3) Luego reemplaza los placeholders de UUID y ejecuta este script.

-- Garantiza país Colombia
insert into public.countries (name, code)
values ('Colombia', 'CO')
on conflict (code) do nothing;

-- Garantiza roles base
insert into public.roles (name)
values ('superadmin'), ('admin'), ('agente')
on conflict (name) do nothing;

-- Placeholders (reemplazar por UUID reales de auth.users)
-- {{SUPERADMIN_USER_ID}}
-- {{ADMIN_USER_ID}}
-- {{AGENTE_USER_ID}}

with co as (
  select id from public.countries where code = 'CO' limit 1
)
insert into public.profiles (id, email, role, country_id)
select
  '2c0c8730-9f36-4687-8828-923c784dda59'::uuid,
  'superadmin@superozono.local',
  'superadmin',
  co.id
from co
on conflict (id) do update
set
  email = excluded.email,
  role = excluded.role,
  country_id = excluded.country_id;

with co as (
  select id from public.countries where code = 'CO' limit 1
)
insert into public.profiles (id, email, role, country_id)
select
  'ee057a46-670f-4c96-a7bb-0e3c13d30f14'::uuid,
  'admin@superozono.local',
  'admin',
  co.id
from co
on conflict (id) do update
set
  email = excluded.email,
  role = excluded.role,
  country_id = excluded.country_id;

with co as (
  select id from public.countries where code = 'CO' limit 1
)
insert into public.profiles (id, email, role, country_id)
select
  '67714b1b-36fd-4684-a0ec-d1ce5af3fcff'::uuid,
  'agente@superozono.local',
  'agente',
  co.id
from co
on conflict (id) do update
set
  email = excluded.email,
  role = excluded.role,
  country_id = excluded.country_id;

-- Nota de modelo:
-- un profile solo puede tener UN rol; no es posible que el mismo usuario sea admin y agente simultáneamente.