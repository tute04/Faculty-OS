-- Fix RLS policies to allow profile insertion by the owner
-- This is critical for the frontend fallback creation logic

do $$ 
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can insert their own profile' and tablename = 'profiles') then
    create policy "Users can insert their own profile" on public.profiles
      for insert with check (auth.uid() = id);
  end if;
end $$;

-- Also ensure email column is present since trigger uses it
alter table public.profiles add column if not exists email text;
