-- 20_whatsapp_runtime_config.sql
-- Configuración dinámica de salida WhatsApp para evitar cambios por deploy.

create table if not exists public.whatsapp_runtime_config (
  key text primary key,
  value jsonb not null,
  enabled boolean not null default true,
  description text,
  updated_at timestamptz not null default now()
);

insert into public.whatsapp_runtime_config (key, value, enabled, description)
values
  ('graph_api_version', '"v22.0"'::jsonb, true, 'Versión de Graph API para envíos'),
  ('outbound_default_mode', '"auto"'::jsonb, true, 'Modo por defecto: auto | text | template'),
  ('outbound_conversation_window_hours', '24'::jsonb, true, 'Horas de ventana para mensajes libres'),
  ('outbound_allow_text_outside_window', 'false'::jsonb, true, 'Permite texto libre fuera de ventana'),
  ('outbound_require_template_outside_window', 'true'::jsonb, true, 'Obliga plantilla fuera de ventana'),
  ('outbound_default_template_language', '"es"'::jsonb, true, 'Idioma por defecto de plantillas'),
  ('outbound_dry_run', 'false'::jsonb, true, 'Si está en true, no envía a Meta y simula éxito')
on conflict (key) do nothing;

alter table if exists public.message_templates
  add column if not exists send_mode text;

alter table if exists public.message_templates
  add column if not exists provider_template_name text;

alter table if exists public.message_templates
  add column if not exists provider_language_code text;

alter table if exists public.message_templates
  add column if not exists variable_defaults jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'message_templates_send_mode_check'
  ) then
    alter table public.message_templates
      add constraint message_templates_send_mode_check
      check (send_mode in ('auto', 'text', 'template') or send_mode is null);
  end if;
end;
$$;

create index if not exists message_templates_provider_template_idx
  on public.message_templates (provider_template_name);

alter table if exists public.messages
  add column if not exists status text;

alter table if exists public.messages
  add column if not exists provider text;

alter table if exists public.messages
  add column if not exists provider_message_id text;

alter table if exists public.messages
  add column if not exists template_name text;

alter table if exists public.messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_status_check'
  ) then
    alter table public.messages
      add constraint messages_status_check
      check (status in ('pending', 'sent', 'failed') or status is null);
  end if;
end;
$$;

create index if not exists messages_provider_message_id_idx
  on public.messages (provider_message_id);

comment on table public.whatsapp_runtime_config is
  'Configuración runtime de WhatsApp outbound para ajustes sin redeploy';

comment on column public.message_templates.provider_template_name is
  'Nombre exacto de plantilla aprobada en Meta';

comment on column public.message_templates.variable_defaults is
  'Variables por defecto para placeholders dinámicos';

comment on column public.messages.metadata is
  'Payload técnico del envío outbound (modo, respuesta proveedor, error)';
