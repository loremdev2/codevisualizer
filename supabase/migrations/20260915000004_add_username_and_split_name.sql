-- Add username (unique handle) and split name into first/last.
-- Username is required for new users; existing users get a temporary one.

-- Add username column (unique, lowercase)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS username text unique;

-- Add first_name and last_name columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Backfill existing users: generate username from email prefix
UPDATE public.users
SET username = lower(regexp_replace(email, '@.*', '', 'g'))
WHERE username IS NULL;

-- Backfill first_name from existing name
UPDATE public.users
SET first_name = split_part(name, ' ', 1)
WHERE first_name IS NULL AND name IS NOT NULL;

-- Backfill last_name from existing name (everything after first word)
UPDATE public.users
SET last_name = regexp_replace(name, '^[^ ]+ ', '', 'g')
WHERE last_name IS NULL AND name IS NOT NULL AND position(' ' in name) > 0;

-- Make username NOT NULL after backfill
ALTER TABLE public.users
ALTER COLUMN username SET NOT NULL;
