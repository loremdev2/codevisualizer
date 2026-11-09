-- Server-side AI translation usage caps (spend protection).
--
-- Every Java/C++ run costs an LLM call (and the translate route may retry), so
-- translations are rate limited per user: a generous hourly and daily budget
-- for signed-in users, and zero for guests (guests can't use Java/C++ at all —
-- enforced in the translate route by requiring a session cookie). Counters are
-- stored as (user_id, bucket_type, bucket_start) rows; bump_ai_usage does an
-- atomic upsert-and-increment so concurrent requests can't race past the cap.
create table public.ai_translation_usage (
  user_id text not null,
  bucket_type text not null check (bucket_type in ('hour', 'day')),
  bucket_start timestamptz not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket_type, bucket_start)
);

alter table public.ai_translation_usage enable row level security;

-- Only the server (service-role key) reads or writes this table — no anon or
-- authenticated grants, and no RLS policies, so it's invisible to clients.

-- Atomic bump + read: inserts the bucket row at count 1, or increments it on
-- conflict, and returns the new count. Called with the service key, which
-- bypasses RLS.
create or replace function public.bump_ai_usage(p_user text, p_bucket text, p_start timestamptz)
returns integer
language sql
as $$
  insert into public.ai_translation_usage (user_id, bucket_type, bucket_start, count)
  values (p_user, p_bucket, p_start, 1)
  on conflict (user_id, bucket_type, bucket_start)
  do update set count = public.ai_translation_usage.count + 1, updated_at = now()
  returning count;
$$;
