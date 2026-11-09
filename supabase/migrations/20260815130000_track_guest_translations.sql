-- Track guest TypeScript-fallback translations (spend visibility).
--
-- Guests can't use Java/C++ at all (server-enforced 403 in the translate
-- route), but their exotic-TypeScript fallback still reaches the LLM. Those
-- calls are now counted in ai_translation_usage under the sentinel user_id
-- '__guest__' (the table's user_id is free text, not an FK), so the admin
-- dashboard's LLM-calls and cache hit-rate numbers are exact.

-- ai_translation_summary: expose guest fallback calls separately from the
-- signed-in total (llm_calls already includes them via the sentinel row).
create or replace function public.ai_translation_summary(p_days integer)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'cache_rows', (select count(*) from public.ai_translation_cache),
    'cache_hits', coalesce((select sum(hits) from public.ai_translation_cache), 0),
    'llm_calls', coalesce((select sum(count) from public.ai_translation_usage where bucket_start >= now() - make_interval(days => p_days)), 0),
    'guest_llm_calls', coalesce((select sum(count) from public.ai_translation_usage where user_id = '__guest__' and bucket_start >= now() - make_interval(days => p_days)), 0),
    'denials_24h', (select count(*) from public.ai_translation_denials where created_at >= now() - interval '24 hours'),
    'denials_7d', (select count(*) from public.ai_translation_denials where created_at >= now() - make_interval(days => p_days))
  );
$$;

-- ai_translation_usage_by_user: skip the '__guest__' sentinel — it isn't a
-- user, and its uuid cast would fail. Only real uuid user ids appear.
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
    and u.user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  group by u.user_id, users.email
  order by total desc
  limit 15;
$$;
