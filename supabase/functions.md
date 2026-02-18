# Supabase Functions / Backend Tasks

## Objetivo

Centralizar lógica sensible y asincrónica fuera del frontend.

## Prioridad de implementación

1. `process_whatsapp_webhook`
	- Parsea eventos entrantes
	- Normaliza payload
	- Persiste logs
2. `dispatch_whatsapp_message`
	- Envía mensajes con plantillas aprobadas
	- Maneja rate limits y errores
3. `lead_sla_enforcer`
	- Revisa SLA de 5 días
	- Cierra por tiempo cuando aplique
4. `task_reminder_scheduler`
	- Detecta tareas próximas/vencidas
	- Genera alertas internas

## Criterios técnicos

- Idempotencia obligatoria en funciones que procesen webhooks.
- Reintentos con control de errores.
- Logs de ejecución con trazabilidad.
- Sin claves o secretos en cliente.

## Nota de seguridad

RLS se aplicará al final del proyecto (ver `supabase/rls.md`). Hasta entonces, mantener funciones y operaciones sensibles del lado servidor.
