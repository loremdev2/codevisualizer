-- Let feedback submissions carry the code that misbehaved (and optionally the
-- input), so the maintainer can reproduce the issue directly.
alter table public.feedback add column if not exists code text null;
alter table public.feedback add column if not exists input_text text null;
