-- AI translation rate-limit events (429s), recorded by the translate route for
-- the admin spend dashboard. The usage table stores counters; this table
-- stores every request that was rejected, so you can see who got stopped and
-- how often. Only the server (service-role key) writes or reads it.
create table public.ai_translation_denials (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  bucket_type text not null check (bucket_type in ('hour', 'day')),
  count integer not null,
  retry_after_seconds integer not null,
  created_at timestamptz not null default now()
);

create index ai_translation_denials_created_idx on public.ai_translation_denials (created_at desc);

alter table public.ai_translation_denials enable row level security;

-- One-shot aggregate for the admin dashboard: cache inventory + hit counter,
-- signed-in LLM calls (sum of usage day/hour counters), and denial counts,
-- all relative to now() - p_days. Called with the service key, which bypasses
-- RLS.
create or replace function public.ai_translation_summary(p_days integer)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'cache_rows', (select count(*) from public.ai_translation_cache),
    'cache_hits', coalesce((select sum(hits) from public.ai_translation_cache), 0),
    'llm_calls', coalesce((select sum(count) from public.ai_translation_usage where bucket_start >= now() - make_interval(days => p_days)), 0),
    'denials_24h', (select count(*) from public.ai_translation_denials where created_at >= now() - interval '24 hours'),
    'denials_7d', (select count(*) from public.ai_translation_denials where created_at >= now() - make_interval(days => p_days))
  );
$$;

-- Per-user translation totals over the window, joined to emails for the admin
-- table. Only day buckets are summed (hour buckets are a sub-aggregate, so
-- including them would double count). user_id is always a users.id (uuid::text),
-- so the cast is safe.
create or replace function public.ai_translation_usage_by_user(p_days integer)
returns table (user_id text, email text, total bigint, last_active timestamptz)
language sql
stable
as $$
  select u.user_id,
         users.email,
         sum(u.count)::bigint as total,
         max(u.updated_at) as last_active
  from public.ai_translation_usage u
  left join public.users users on users.id = u.user_id::uuid
  where u.bucket_type = 'day'
    and u.bucket_start >= now() - make_interval(days => p_days)
  group by u.user_id, users.email
  order by total desc
  limit 15;
$$;
