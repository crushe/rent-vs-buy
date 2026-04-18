-- Rent vs Buy Calculator: Supabase schema
-- Run this in your Supabase SQL Editor after creating the project.

-- Enable Row Level Security globally (standard practice)
-- The scenarios table stores each user's saved scenarios.

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scenarios_user_id_idx on public.scenarios(user_id);
create index if not exists scenarios_updated_at_idx on public.scenarios(updated_at desc);

-- RLS: each user can only see and modify their own scenarios
alter table public.scenarios enable row level security;

drop policy if exists "Users can view their own scenarios" on public.scenarios;
create policy "Users can view their own scenarios"
  on public.scenarios for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own scenarios" on public.scenarios;
create policy "Users can insert their own scenarios"
  on public.scenarios for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own scenarios" on public.scenarios;
create policy "Users can update their own scenarios"
  on public.scenarios for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own scenarios" on public.scenarios;
create policy "Users can delete their own scenarios"
  on public.scenarios for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at on row updates
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists scenarios_updated_at on public.scenarios;
create trigger scenarios_updated_at
  before update on public.scenarios
  for each row execute function public.update_updated_at();
