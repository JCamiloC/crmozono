-- 10_conversations.sql
-- Conversaciones por lead para mensajería WhatsApp

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  last_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists conversations_lead_id_unique
  on public.conversations (lead_id);

comment on table public.conversations is 'Conversaciones de mensajería asociadas a un lead';

-- TODO: agregar RLS y políticas por país/rol.
