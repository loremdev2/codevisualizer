-- Server-side AI translation cache.
--
-- Identical translation requests (same language + code + input) are served
-- from this table, skipping the paid LLM call entirely — and cache hits never
-- consume the user's hourly/daily usage budget (the route checks the cache
-- before it bumps the rate-limit counters). This dedupes across sessions and
-- browsers; the client-side cache already handles the same-browser repeat.
--
-- Only the translated JavaScript is stored (keyed by content hashes) — the
-- original source is never persisted. No anon or authenticated grants: the
-- service-role key is the only reader/writer, so cached code never leaks
-- through the API.
create table public.ai_translation_cache (
  key text primary key,
  language text not null,
  code_hash text not null,
  input_hash text not null,
  translated_code text not null,
  hits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_translation_cache enable row level security;

-- Fire-and-forget hit counter so cache effectiveness is measurable in
-- Supabase Studio (called with the service key, which bypasses RLS).
create or replace function public.bump_cache_hits(p_key text)
returns void
language sql
as $$
  update public.ai_translation_cache set hits = hits + 1, updated_at = now() where key = p_key;
$$;
