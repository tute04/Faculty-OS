-- Ejecutar en Supabase SQL Editor
-- Arregla todos los permisos de la tabla profiles

-- 1. Borrar TODAS las politicas existentes (viejas y nuevas)
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Permitir actualizaciones de perfil" on public.profiles;
drop policy if exists "select_own_profile" on public.profiles;
drop policy if exists "insert_own_profile" on public.profiles;
drop policy if exists "update_own_profile" on public.profiles;

-- 2. Asegurar columnas necesarias
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists career text;
alter table public.profiles add column if not exists year_of_study smallint;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists has_completed_onboarding boolean default false;
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- 3. Crear politicas limpias
create policy "select_own_profile" on public.profiles
  for select using (auth.uid() = id);

create policy "insert_own_profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "update_own_profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
