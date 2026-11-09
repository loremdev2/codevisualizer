-- Add a timestamp to track when the user last changed their display name.
-- Used to enforce a 24-hour cooldown between name changes.
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_name_change_at timestamptz;

-- Create an index for efficient cooldown checks
CREATE INDEX IF NOT EXISTS idx_users_last_name_change
ON public.users (last_name_change_at);
