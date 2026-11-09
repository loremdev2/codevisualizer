-- Admin access to feedback.
--
-- Admins are the people listed in `public.admins` (user ids looked up from
-- auth.users by email). Feedback stays insert-only for everyone else; the
-- select/update policies below let admins read submissions and flip the
-- review status. `public.admins` itself is locked down — the only way to
-- check membership is the security-definer `public.is_admin()` function,
-- which the app calls via RPC. The SQL is idempotent: safe to re-run.

-- 1. Admins table -----------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
-- No policies: nobody can read or write the admins list through the API.
-- Membership is only exposed through public.is_admin(), a security-definer
-- function that runs with the table owner's privileges.

-- 2. Membership check -------------------------------------------------------
-- plpgsql (not sql) so Postgres never inlines it and the security-definer
-- privilege actually applies inside RLS policy expressions.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return exists (
    select 1 from public.admins where user_id = auth.uid()
  );
end;
$$;

grant execute on function public.is_admin() to authenticated;

-- 3. Review status ----------------------------------------------------------
-- Tracks triage in the app itself so admins can see what's left to handle.
alter table public.feedback add column if not exists status text not null default 'new'
  check (status in ('new', 'read', 'resolved'));

-- 4. RLS: admins can read feedback and update its status --------------------
-- Base privileges first (rows are still restricted by the policies below).
grant select on public.feedback to authenticated;
grant update (status) on public.feedback to authenticated;

drop policy if exists "Admins can read feedback" on public.feedback;
create policy "Admins can read feedback"
  on public.feedback for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update feedback" on public.feedback;
create policy "Admins can update feedback"
  on public.feedback for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Grant the current admins -----------------------------------------------
insert into public.admins (user_id, email)
select id, email
from auth.users
where lower(email) in ('loremipsum3003@gmail.com', 'amansinganamala@gmail.com')
on conflict (user_id) do nothing;

-- 6. Auto-promote these emails on future sign-ups ---------------------------
-- Covers the case where an admin account is created after this migration runs.
create or replace function public.sync_admin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) in ('loremipsum3003@gmail.com', 'amansinganamala@gmail.com') then
    insert into public.admins (user_id, email)
    values (new.id, new.email)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_admin_on_signup on auth.users;
create trigger sync_admin_on_signup
  after insert on auth.users
  for each row execute function public.sync_admin_on_signup();
