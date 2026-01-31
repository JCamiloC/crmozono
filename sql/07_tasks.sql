-- 07_tasks.sql
-- Tabla de tareas

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  agente_id uuid not null,
  titulo text not null,
  tipo_tarea text not null,
  descripcion text,
  fecha_programada timestamptz not null,
  estado text not null,
  fecha_creacion timestamptz not null default now(),
  fecha_completada timestamptz
);

comment on table public.tasks is 'Tareas y recordatorios asociados a leads';

-- TODO: agregar RLS y políticas por país/rol.
