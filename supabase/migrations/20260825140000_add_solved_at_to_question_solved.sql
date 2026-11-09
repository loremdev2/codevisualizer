-- Ensure `solved_at` exists on `question_solved` for timestamp tracking.
-- Safe to run multiple times: the IF NOT EXISTS guard prevents errors
-- if the column was already created by the initial migration.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'question_solved' AND column_name = 'solved_at'
  ) THEN
    ALTER TABLE public.question_solved
      ADD COLUMN solved_at timestamptz not null default now();
  END IF;
END $$;
