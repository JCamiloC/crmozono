-- 19_webhook_idempotency.sql
-- Refuerzo de idempotencia para webhooks de WhatsApp.

create unique index if not exists webhook_events_unique_message_received_idx
  on public.webhook_events (provider, event_type, message_id)
  where message_id is not null and event_type = 'message_received';

comment on index webhook_events_unique_message_received_idx is
  'Evita procesar dos veces el mismo message_id para mensajes recibidos';
