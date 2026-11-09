-- Auto-attached trace context for feedback submissions: when a user reports a
-- problem from the visualizer, the dialog attaches the step they were viewing,
-- the run's verdict, and the expected-vs-actual result so the maintainer can
-- reproduce the issue without asking follow-up questions.
alter table public.feedback add column if not exists step_index int null;
alter table public.feedback add column if not exists step_count int null;
alter table public.feedback add column if not exists result_text text null;
alter table public.feedback add column if not exists expected_text text null;
alter table public.feedback add column if not exists verdict text null
  check (verdict is null or verdict in ('pass', 'fail', 'none'));
