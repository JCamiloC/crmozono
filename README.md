# SuperOzono CRM

CRM de ventas multi-país con Next.js + Supabase + WhatsApp Business API.

## Estado actual

- Frontend funcional con módulos: login, leads, tareas, llamadas, mensajes, campañas y configuración.
- Build de producción funcionando (`npm run build`).
- SQL base versionado en `/sql`.
- Servicios de `leads` y `tasks` conectados a Supabase real (sin RLS por ahora).
- Servicios de `mensajes`, `llamadas`, `campañas` y `auditoría` conectados a Supabase real.
- WhatsApp inbound (webhook) y outbound (send) conectados a Cloud API.
- Configuración runtime de WhatsApp en BD (`whatsapp_runtime_config`) para ajustes sin redeploy.

## Decisión de implementación: RLS al final

Para acelerar desarrollo funcional y evitar bloqueos tempranos en consultas/inserciones durante iteración UI/servicios:

- **RLS se implementa en la fase final de hardening**.
- Mientras tanto, se trabaja con estructura de tablas, servicios y validaciones de negocio.
- Antes de pasar a producción: RLS será obligatoria en todas las tablas sensibles.

Detalles en `/supabase/rls.md`.

## Variables de entorno

Revisar `.env.example` y definir en `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (para verificación GET de webhook)
- `WHATSAPP_APP_SECRET` (para validar firma en webhook POST)

## Scripts

- `npm run dev`: entorno local
- `npm run build`: build de producción
- `npm run start`: ejecutar build
- `npm run lint`: lint con ESLint

## Roadmap sugerido (sin RLS por ahora)

1. Ejecutar migraciones SQL nuevas (`10` a `16`) y permisos de desarrollo (`09_permissions_no_rls.sql`).
2. Completar webhook de WhatsApp (persistencia + clasificación + reintentos).
3. Completar automatizaciones de mensajería por estado/SLA usando configuración runtime.
4. Fase final: RLS completa + pruebas de seguridad + salida a producción.
