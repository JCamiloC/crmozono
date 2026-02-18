# Webhooks WhatsApp

## Estado actual

- Endpoint base implementado en `app/api/webhooks/whatsapp/route.ts`.
- Verificación `GET` con `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
- Recepción `POST` con validación de firma opcional (`WHATSAPP_APP_SECRET`).
- Registro temporal en consola para depuración.

## Pendiente de implementación

- Persistencia de eventos en tabla dedicada (`webhook_events`).
- Idempotencia por `event_id`/hash de payload.
- Clasificación de eventos por tipo:
	- `message_received`
	- `message_sent`
	- `message_failed`
	- `message_read`
- Reintentos controlados y monitoreo de errores.

## Reglas de seguridad

- No exponer secretos en frontend.
- Validar firma de Meta en producción.
- Rechazar payloads inválidos con respuesta 4xx.
- Responder rápido al webhook y procesar pesado fuera de la request.

## Próximo paso sugerido

1. Crear tabla `webhook_events`.
2. Insertar evento bruto + metadatos mínimos.
3. Procesar por tipo de evento en servicio desacoplado.
4. Agregar métricas básicas de fallos y eventos procesados.
