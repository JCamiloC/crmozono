-- 21_automations_no_response_config.sql
-- Parámetros runtime para automatización de no respuesta.

insert into public.whatsapp_runtime_config (key, value, enabled, description)
values
  (
    'automations_no_response_enabled',
    'true'::jsonb,
    true,
    'Activa tarea automática cuando no hay respuesta del lead'
  ),
  (
    'automations_no_response_minutes',
    '10'::jsonb,
    true,
    'Minutos sin respuesta para disparar tarea automática (recomendado pruebas: 5-10)'
  ),
  (
    'automations_no_response_statuses',
    '["contactado","seguimiento"]'::jsonb,
    true,
    'Estados de lead elegibles para automatización de no respuesta'
  ),
  (
    'automations_no_response_task_type',
    '"seguimiento_automatico"'::jsonb,
    true,
    'tipo_tarea que se crea automáticamente'
  ),
  (
    'automations_no_response_task_title',
    '"Seguimiento automático por no respuesta"'::jsonb,
    true,
    'Título base para tareas automáticas de no respuesta'
  )
on conflict (key) do update
set
  value = excluded.value,
  enabled = excluded.enabled,
  description = excluded.description,
  updated_at = now();
