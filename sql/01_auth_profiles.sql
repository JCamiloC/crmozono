-- 01_auth_profiles.sql
-- Crea tabla profiles vinculada a auth.users

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null,
  country_id uuid,
  created_at timestamptz default now()
);

comment on table public.profiles is 'Perfil de usuario vinculado a auth.users';
