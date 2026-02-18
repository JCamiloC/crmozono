-- 23_automations_sla_close_config.sql
-- Parámetros runtime para cierre automático por SLA.

insert into public.whatsapp_runtime_config (key, value, enabled, description)
values
  (
    'automations_sla_close_enabled',
    'true'::jsonb,
    true,
    'Activa cierre automático de leads por SLA'
  ),
  (
    'automations_sla_close_days',
    '5'::jsonb,
    true,
    'Días para cierre automático de lead por SLA'
  ),
  (
    'automations_sla_close_statuses',
    '["nuevo","contactado","seguimiento","llamada"]'::jsonb,
    true,
    'Estados de lead elegibles para cierre automático por SLA'
  ),
  (
    'automations_sla_close_target_status',
    '"cerrado_tiempo"'::jsonb,
    true,
    'Estado final al cerrar un lead por SLA'
  )
on conflict (key) do update
set
  value = excluded.value,
  enabled = excluded.enabled,
  description = excluded.description,
  updated_at = now();
