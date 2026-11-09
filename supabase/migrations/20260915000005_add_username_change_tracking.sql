-- Add columns for tracking username changes
-- 30-day cooldown between changes (longer than name changes since username is unique and public)

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_username_change_at timestamptz;

-- Index for efficient cooldown checks
CREATE INDEX IF NOT EXISTS idx_users_last_username_change
ON public.users (last_username_change_at)
WHERE last_username_change_at IS NOT NULL;

-- Add audit log table for username changes
CREATE TABLE IF NOT EXISTS public.username_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  old_username text NOT NULL,
  new_username text NOT NULL,
  changed_at timestamptz DEFAULT now() NOT NULL
);

-- Index for querying audit logs by user
CREATE INDEX IF NOT EXISTS idx_username_audit_user
ON public.username_audit_log (user_id, changed_at DESC);

-- Enable RLS on audit log
ALTER TABLE public.username_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "Users can view own username audit logs"
  ON public.username_audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only the app can insert audit logs (via service role)
CREATE POLICY "Service role can insert username audit logs"
  ON public.username_audit_log
  FOR INSERT
  WITH CHECK (true);
