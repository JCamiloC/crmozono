-- 12_message_templates.sql
-- Plantillas de mensajería aprobadas (catálogo)

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  preview text not null,
  body text not null,
  created_at timestamptz not null default now()
);

insert into public.message_templates (name, preview, body)
values
  ('Bienvenida', 'Hola {{nombre}}, gracias por contactarnos...', 'Hola {{nombre}}, gracias por contactarnos en SuperOzono. ¿En qué podemos ayudarte?'),
  ('Seguimiento', 'Queremos saber si pudiste revisar...', 'Hola {{nombre}}, queremos saber si pudiste revisar la propuesta. Quedamos atentos.'),
  ('Garantía', 'Gracias por tu compra, te recordamos...', 'Gracias por tu compra. Recuerda que tu garantía está activa y nuestro equipo te acompaña.')
on conflict (name) do nothing;

comment on table public.message_templates is 'Plantillas aprobadas de mensajería';

-- TODO: agregar RLS y políticas por país/rol.
