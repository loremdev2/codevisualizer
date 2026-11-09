create table public.whiteboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200) default 'Untitled whiteboard',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index whiteboards_user_updated_idx
  on public.whiteboards (user_id, updated_at desc);

alter table public.whiteboards enable row level security;

grant select, insert, update, delete on public.whiteboards to authenticated;

create policy "Users can view their whiteboards"
  on public.whiteboards for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their whiteboards"
  on public.whiteboards for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their whiteboards"
  on public.whiteboards for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their whiteboards"
  on public.whiteboards for delete
  to authenticated
  using ((select auth.uid()) = user_id);
