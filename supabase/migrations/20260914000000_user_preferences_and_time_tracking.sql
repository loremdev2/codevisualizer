-- User preferences: stores per-user settings like daily practice goal.
-- One row per user, upserted on save.

create table if not exists public.user_preferences (
  user_id        uuid primary key references public.users(id) on delete cascade,
  daily_goal     integer not null default 5 check (daily_goal >= 1 and daily_goal <= 100),
  updated_at     timestamptz not null default now()
);

-- Time tracking: add duration_ms to activity_events for question solve times.
-- This is nullable — only populated for question_solved events where timing was captured.
alter table public.activity_events
  add column if not exists duration_ms integer check (duration_ms is null or duration_ms >= 0);

-- Index for time-based queries (avg time per difficulty, etc.)
create index if not exists activity_events_duration
  on public.activity_events (event, duration_ms)
  where duration_ms is not null;
