# 15-pruebas-colombia-usuarios.md

## Objetivo

Dejar ambiente de pruebas en Colombia con tres perfiles:

- superadmin (existente)
- admin (nuevo)
- agente (nuevo)

> Nota: el modelo actual permite un solo rol por usuario. Un usuario no puede ser admin y agente al mismo tiempo.

---

## 1) Crear usuarios en Supabase Auth

En Supabase Dashboard:

1. Authentication → Users → Add user
2. Crear usuario `admin.co@superozonoglobal.com` (password temporal)
3. Crear usuario `agente.co@superozonoglobal.com` (password temporal)
4. Copiar el UUID (`id`) de cada usuario creado

---

## 2) Preparar script de asignación

Abrir:

- `sql/18_seed_colombia_assignments.sql`

Reemplazar placeholders:

- `{{SUPERADMIN_USER_ID}}`
- `{{ADMIN_USER_ID}}`
- `{{AGENTE_USER_ID}}`

---

## 3) Ejecutar script

Ejecutar en SQL Editor de Supabase:

- `sql/18_seed_colombia_assignments.sql`

Este script:

- Garantiza país `CO`
- Garantiza roles base
- Asigna superadmin/admin/agente a Colombia

---

## 4) Verificar configuración

1. Iniciar sesión en CRM con superadmin
2. Ir a `/dashboard/configuracion`
3. Confirmar que:
   - admin está en rol `admin` y país `Colombia`
   - agente está en rol `agente` y país `Colombia`

---

## 5) Probar flujo webhook

1. Enviar mensaje desde celular al número de WhatsApp conectado
2. Verificar en Supabase:
   - `webhook_events` creado
   - lead nuevo asignado a Colombia
   - conversación y mensaje inbound en `conversations/messages`
