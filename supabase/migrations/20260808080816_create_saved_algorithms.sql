create table public.saved_algorithms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  topic text not null check (char_length(topic) between 1 and 80),
  tags text[] not null default '{}',
  language text not null default 'javascript',
  code text not null,
  input_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_algorithms_user_updated_idx
  on public.saved_algorithms (user_id, updated_at desc);

alter table public.saved_algorithms enable row level security;

grant select, insert, update, delete on public.saved_algorithms to authenticated;

create policy "Users can view their saved algorithms"
  on public.saved_algorithms for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their saved algorithms"
  on public.saved_algorithms for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their saved algorithms"
  on public.saved_algorithms for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their saved algorithms"
  on public.saved_algorithms for delete
  to authenticated
  using ((select auth.uid()) = user_id);
