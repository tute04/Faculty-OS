-- Update the profiles table to store extra fields
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists career text;
alter table public.profiles add column if not exists year_of_study smallint;
alter table public.profiles add column if not exists email text;

-- Update the handle_new_user trigger to only set email and ID
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
