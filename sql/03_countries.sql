-- 03_countries.sql
-- Catálogo de países

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null
);

comment on table public.countries is 'Catálogo de países';
