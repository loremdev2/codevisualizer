-- Activity ledger: one row per meaningful product event.
--
-- Replaces four parallel records of "did this question" (question_solved,
-- learning_progress, heatmap timestamps, client-side solve-rate derivation)
-- with a single append-only stream that feeds heatmap, solve-rate, stats
-- strips, streaks, and the guest free-trace quota from one truth.
--
-- actor_kind:
--   'user' → actor_id references public.users(id) (no FK on purpose:
--            rows are written before/without user rows for anon adoption,
--            and the ledger must never block a run on identity lookups)
--   'anon' → actor_id is a random uuid minted by the server for a cookie
--
-- Idempotent: safe to re-run.

create table if not exists public.activity_events (
  id bigint generated always as identity primary key,
  actor_kind text not null check (actor_kind in ('user', 'anon')),
  actor_id uuid not null,
  event text not null check (event in ('trace_run', 'question_solved', 'template_traced')),
  template_id text,
  bank text check (bank in ('top150', 'neetcode', 'sorting', null)),
  question_no integer,
  outcome text,
  created_at timestamptz not null default now()
);

-- Quota lookups filter actor+event; profile summaries filter actor+event+time.
create index if not exists activity_events_actor_event_created
  on public.activity_events (actor_kind, actor_id, event, created_at);

-- Per-question history reads (e.g. "when did I last solve #88?").
create index if not exists activity_events_question
  on public.activity_events (question_no, event, created_at)
  where question_no is not null;

-- Adopting a guest's events on sign-in is a single keyed UPDATE.
create index if not exists activity_events_anon_actor
  on public.activity_events (actor_kind, actor_id)
  where actor_kind = 'anon';
