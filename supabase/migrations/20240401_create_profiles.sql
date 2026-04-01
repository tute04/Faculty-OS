-- supabase/migrations/20240401_create_profiles.sql

-- Se asegura de que la extensión uuid-ossp esté cargada
create extension if not exists "uuid-ossp";

-- Tabla de perfiles para persistencia de configuración del usuario
create table if not exists public.profiles (
  id uuid references auth.users (id) on delete cascade not null primary key,
  has_completed_onboarding boolean default false,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Políticas de RLS
do $$ 
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view their own profile' and tablename = 'profiles') then
    create policy "Users can view their own profile" on public.profiles
      for select using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can update their own profile' and tablename = 'profiles') then
    create policy "Users can update their own profile" on public.profiles
      for update using (auth.uid() = id);
  end if;
end $$;

-- Función de trigger para crear automáticamente el perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para creación automática (si no existe)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
