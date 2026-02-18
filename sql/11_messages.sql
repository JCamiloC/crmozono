-- 11_messages.sql
-- Mensajes de cada conversación

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  body text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id, created_at desc);

comment on table public.messages is 'Mensajes inbound/outbound por conversación';

-- TODO: agregar RLS y políticas por país/rol.
