-- 04_users.sql
-- Relaciones y constraints base

alter table public.profiles
  add constraint profiles_country_id_fkey
  foreign key (country_id) references public.countries(id);

comment on column public.profiles.role is 'Rol del usuario (referencia lógica a roles.name)';
