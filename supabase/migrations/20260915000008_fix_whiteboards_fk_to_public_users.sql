-- Fix whiteboards FK: the table was created with references auth.users(id),
-- but the app switched to direct Google OAuth (no Supabase Auth) in migration
-- 20260813120000. New users get gen_random_uuid() IDs in public.users that
-- don't exist in auth.users, so every whiteboard INSERT/UPDATE for new users
-- fails with:
--   insert or update on table "whiteboards" violates foreign key constraint
--   "whiteboards_user_id_fkey"
--
-- Re-point the FK to public.users(id), matching what saved_algorithms,
-- feedback, and user_preferences already do.
-- Also drop the RLS policies that reference auth.uid() — they are dead code
-- since the app uses the service-role key (bypasses RLS) and auth.uid()
-- returns NULL for non-Supabase-Auth users anyway.

-- 1. Drop the broken FK constraint ------------------------------------------
ALTER TABLE public.whiteboards
  DROP CONSTRAINT IF EXISTS whiteboards_user_id_fkey;

-- 2. Add the correct FK to public.users -------------------------------------
ALTER TABLE public.whiteboards
  ADD CONSTRAINT whiteboards_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Drop dead RLS policies that reference auth.uid() -----------------------
DROP POLICY IF EXISTS "Users can view their whiteboards" ON public.whiteboards;
DROP POLICY IF EXISTS "Users can create their whiteboards" ON public.whiteboards;
DROP POLICY IF EXISTS "Users can update their whiteboards" ON public.whiteboards;
DROP POLICY IF EXISTS "Users can delete their whiteboards" ON public.whiteboards;
DROP POLICY IF EXISTS "Anyone can view public whiteboards" ON public.whiteboards;

-- 4. Disable RLS — the app uses service-role for all whiteboard queries ------
--    (same pattern as public.users after harden_users_rls).
ALTER TABLE public.whiteboards DISABLE ROW LEVEL SECURITY;
