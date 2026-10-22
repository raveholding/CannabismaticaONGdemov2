-- SÓLO PARA PRUEBAS LOCALES: imita lo mínimo de Supabase y de los scripts base (roles, auth.uid(), comercios, miembros).
-- No se corre en el proyecto real.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
-- como en Supabase: pgcrypto en el esquema «extensions», fuera de public
create schema if not exists extensions;
create extension if not exists pgcrypto schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
create table if not exists public.comercios (id uuid primary key, nombre text);
create table if not exists public.miembros (comercio_id uuid references public.comercios(id), user_id uuid, rol text, primary key (comercio_id, user_id));
insert into public.comercios values ('aaaaaaaa-0000-0000-0000-00000000000a', 'ONG A (prueba)'), ('bbbbbbbb-0000-0000-0000-00000000000b', 'ONG B (prueba)') on conflict do nothing;
insert into public.miembros values
  ('aaaaaaaa-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('aaaaaaaa-0000-0000-0000-00000000000a', '22222222-2222-2222-2222-222222222222', 'mostrador'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', '33333333-3333-3333-3333-333333333333', 'admin')
on conflict do nothing;
-- como en Supabase: service_role tiene todos los privilegios sobre las tablas
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on functions to service_role;
