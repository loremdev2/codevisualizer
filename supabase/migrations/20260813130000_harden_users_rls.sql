-- Harden `users`: the table was created without RLS, and Supabase's default
-- privileges auto-grant new tables to the anon and authenticated roles — so
-- anyone holding the public anon key could read every user's email/avatar and
-- even flip `is_admin`. The app only ever touches `users` through the service
-- role (which bypasses RLS and is unaffected by these revokes), so the table
-- is now completely closed to anon and authenticated.
--
-- Run this in the Supabase SQL editor. Idempotent.

alter table public.users enable row level security;

revoke all on public.users from anon, authenticated;
