-- Persist per-user solved status for the /learn question banks.
-- Each row represents one question the user has solved, keyed by LeetCode
-- problem number (the same canonical id used by localStorage today).
-- Upsert on (user_id, question_no) so the toggle is idempotent.

create table if not exists public.question_solved (
  user_id     uuid not null references public.users(id) on delete cascade,
  question_no integer not null check (question_no > 0),
  solved_at   timestamptz not null default now(),
  primary key (user_id, question_no)
);

create index question_solved_user_idx
  on public.question_solved (user_id);
