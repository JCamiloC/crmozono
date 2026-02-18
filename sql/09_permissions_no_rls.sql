-- 09_permissions_no_rls.sql
-- Permisos temporales para desarrollo SIN RLS.
-- IMPORTANTE: revisar y endurecer en la fase final de seguridad.

grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.roles to authenticated;
grant select, insert, update, delete on table public.countries to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select, insert, update, delete on table public.lead_status_history to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.task_history to authenticated;
grant select, insert, update, delete on table public.conversations to authenticated;
grant select, insert, update, delete on table public.messages to authenticated;
grant select, insert, update, delete on table public.message_templates to authenticated;
grant select, insert, update, delete on table public.calls to authenticated;
grant select, insert, update, delete on table public.campaigns to authenticated;
grant select, insert, update, delete on table public.campaign_logs to authenticated;
grant select, insert, update, delete on table public.audit_logs to authenticated;
grant select, insert, update, delete on table public.webhook_events to authenticated;

-- Nota:
-- Mantener estos permisos abiertos solo mientras se implementan flujos funcionales.
-- En fase final se aplicará RLS + permisos mínimos por rol/país.