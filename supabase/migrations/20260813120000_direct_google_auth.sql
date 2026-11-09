-- Move off Supabase Auth onto a first-party users table.
--
-- The app now signs users in with its own Google OAuth client (PKCE flow) and
-- mints its own httpOnly session cookie; the database is reached with the
-- service-role key only, so RLS no longer gates anything. This migration:
--   1. creates `users` (the new identity table),
--   2. copies existing auth.users rows in, KEEPING their ids so
--      saved_algorithms.user_id / feedback.user_id still point at the same
--      people (no data loss),
--   3. re-points those foreign keys from auth.users to users,
--   4. folds the `admins` table + is_admin() RPC into users.is_admin.
-- Idempotent: safe to re-run.

-- 1. Users table ------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  google_sub text unique,
  email text not null unique,
  name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);

-- 2. Migrate existing auth.users into users (keeping ids) -------------------
insert into public.users (id, google_sub, email, name, avatar_url, is_admin, created_at, last_sign_in_at)
select
  au.id,
  nullif(au.raw_user_meta_data->>'sub', ''),
  au.email,
  nullif(au.raw_user_meta_data->>'full_name', ''),
  nullif(au.raw_user_meta_data->>'avatar_url', ''),
  lower(au.email) in ('loremipsum3003@gmail.com', 'amansinganamala@gmail.com'),
  au.created_at,
  au.last_sign_in_at
from auth.users au
on conflict (id) do nothing;

-- 3. Re-point foreign keys from auth.users to users -------------------------
alter table public.saved_algorithms
  drop constraint if exists saved_algorithms_user_id_fkey;
alter table public.saved_algorithms
  add constraint saved_algorithms_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.feedback
  drop constraint if exists feedback_user_id_fkey;
alter table public.feedback
  add constraint feedback_user_id_fkey
  foreign key (user_id) references public.users(id) on delete set null;

-- 4. Fold the admin machinery into users.is_admin ---------------------------
-- Promote anyone already listed in `admins`.
update public.users u
set is_admin = true
from public.admins a
where a.user_id = u.id;

-- Drop the RLS policies that reference is_admin() before dropping the function.
drop policy if exists "Admins can read feedback" on public.feedback;
drop policy if exists "Admins can update feedback" on public.feedback;

drop table if exists public.admins;
drop function if exists public.is_admin();
drop trigger if exists sync_admin_on_signup on auth.users;
drop function if exists public.sync_admin_on_signup();
