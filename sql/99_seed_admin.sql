-- 99_seed_admin.sql
-- SOLO PARA ENTORNOS DE PRUEBA. ELIMINAR EN PRODUCCION.

-- 1) Inserta país base
insert into public.countries (id, name, code)
values (gen_random_uuid(), 'País Demo', 'DEMO')
on conflict do nothing;

-- 2) Inserta roles base
insert into public.roles (name)
values ('superadmin'), ('admin'), ('agente')
on conflict do nothing;

-- 3) Crea usuario admin en Supabase Auth (Dashboard)
-- NOTA: No insertar en auth.users por SQL. Puede romper Auth y causar 500.
-- Crear manualmente en Auth:
-- Email: admin@superozono.local
-- Password: admin

-- 4) Inserta perfil admin (reemplazar el UUID del usuario creado en auth.users)
-- TODO: Reemplazar {{ADMIN_USER_ID}} por el UUID real del usuario en auth.users
insert into public.profiles (id, email, role, country_id)
select
  'ee057a46-670f-4c96-a7bb-0e3c13d30f14'::uuid,
  'admin@superozono.local',
  'admin',
  c.id
from public.countries c
where c.code = 'DEMO'
on conflict do nothing;
