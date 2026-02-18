-- 22_tasks_pending_unique.sql
-- Evita duplicados de tareas pendientes por lead y tipo.

create unique index if not exists tasks_pending_unique_lead_type_idx
  on public.tasks (lead_id, tipo_tarea)
  where estado = 'pendiente';

comment on index tasks_pending_unique_lead_type_idx is
  'Evita crear tareas pendientes duplicadas del mismo tipo para un lead';
