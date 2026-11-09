-- Cleanup from the brief "username required" window: while migration
-- 20260915000004 was live, sign-ups that failed its NOT NULL check (or users
-- whose email local part was shorter than the 3-char minimum) could end up
-- with a NULL username. New users now get one derived from their email
-- automatically in code (see deriveUsernameFromEmail in src/lib/auth/user.ts),
-- and can change it from their profile, so just backfill any stragglers.
-- The derivation mirrors the code exactly: lowercase, take the email's local
-- part, map every non [a-z0-9_] char to '_', cap at 30 chars, pad to >= 3.
UPDATE public.users
SET username = rpad(
  left(
    regexp_replace(
      lower(regexp_replace(email, '@.*', '', 'g')),
      '[^a-z0-9_]', '_', 'g'
    ),
    30
  ),
  3, '_'
)
WHERE username IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.users other
    WHERE other.username = rpad(
      left(
        regexp_replace(
          lower(regexp_replace(users.email, '@.*', '', 'g')),
          '[^a-z0-9_]', '_', 'g'
        ),
        30
      ),
      3, '_'
    )
  );

-- (Re)ensure the column is nullable: sign-up code inserts the row in one
-- step and must not be blocked by a NOT NULL constraint if the derived
-- username ever fails validation server-side.
ALTER TABLE public.users
  ALTER COLUMN username DROP NOT NULL;
