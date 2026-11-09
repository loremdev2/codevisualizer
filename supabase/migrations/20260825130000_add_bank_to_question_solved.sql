-- Add a `bank` column so each question bank (top150, neetcode) tracks solved
-- status independently on the server while the client still merges them into
-- one unified set for the shared-state UX.
--
-- The old PK was (user_id, question_no). The new PK is (user_id, bank, question_no)
-- so the same LeetCode problem can appear in multiple banks without collision.
-- Existing rows default to 'top150' so nothing breaks on deploy.

ALTER TABLE public.question_solved
  ADD COLUMN bank text not null default 'top150';

-- Rebuild the primary key to include `bank`.
ALTER TABLE public.question_solved
  DROP CONSTRAINT question_solved_pkey;

ALTER TABLE public.question_solved
  ADD PRIMARY KEY (user_id, bank, question_no);

-- Keep the existing user-only index; add a bank-scoped one for per-bank fetches.
CREATE INDEX IF NOT EXISTS question_solved_bank_idx
  ON public.question_solved (user_id, bank);
