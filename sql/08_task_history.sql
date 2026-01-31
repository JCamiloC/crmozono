-- 08_task_history.sql
-- Historial de estados de tareas

create table if not exists public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  estado text not null,
  fecha timestamptz not null default now(),
  usuario_id uuid not null,
  comentario text
);

comment on table public.task_history is 'Historial de cambios de estado de tareas';

-- TODO: agregar RLS y políticas por país/rol.
