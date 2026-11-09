-- Persist per-user learning path progress: which templates have been traced.
-- Each row represents one template the user has successfully run, keyed by
-- template id (the same canonical id used by localStorage today).
-- Upsert on (user_id, template_id) so recording a trace is idempotent.

create table if not exists public.learning_progress (
  user_id     uuid not null references public.users(id) on delete cascade,
  template_id text not null,
  traced      boolean not null default true,
  traced_at   timestamptz not null default now(),
  primary key (user_id, template_id)
);

create index learning_progress_user_idx
  on public.learning_progress (user_id);
