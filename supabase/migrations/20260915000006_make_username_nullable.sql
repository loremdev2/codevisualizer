-- Relax the NOT NULL constraint on username: new Google SSO users are
-- created without a username first, then prompted to pick one on their
-- first visit (see UsernamePrompt + POST /api/me/username-setup).
-- The unique constraint still applies to all non-null values, and Postgres
-- allows multiple NULLs in a unique column, so this is safe.
ALTER TABLE public.users
ALTER COLUMN username DROP NOT NULL;
