# Supabase – Configuración Base

## Objetivo
Documentar la configuración base de Supabase para el CRM y el orden de ejecución del SQL.

## Variables de Entorno
Definir en `.env` (no subir al repositorio):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (solo backend)

## Orden de ejecución de SQL
1. /sql/01_auth_profiles.sql
2. /sql/02_roles.sql
3. /sql/03_countries.sql
4. /sql/04_users.sql
5. /sql/05_leads.sql
6. /sql/06_lead_status_history.sql
7. /sql/07_tasks.sql
8. /sql/08_task_history.sql
9. /sql/99_seed_admin.sql (solo pruebas)

## Tablas Base
- profiles: perfil de usuario vinculado a auth.users
- roles: catálogo de roles (superadmin, admin, agente)
- countries: catálogo de países

## Advertencias de Seguridad
- No exponer `SUPABASE_SERVICE_ROLE_KEY` en frontend.
- Todas las tablas productivas deben tener RLS habilitado.

## TODO
- Definir políticas RLS detalladas por tabla.
- Agregar triggers de auditoría.
