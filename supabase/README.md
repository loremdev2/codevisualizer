# Database setup (from code only)

Tables, policies, and the storage bucket are defined as migrations in
`supabase/migrations/` — no manual SQL Editor work needed. Apply them with the
Supabase CLI:

## One-time setup

1. **Install the CLI** (macOS):

   ```bash
   brew install supabase/tap/supabase
   ```

   (or `npm install -g supabase` — any installation method works)

2. **Log in** — opens your browser to create a personal access token:

   ```bash
   npm run db:login
   ```

3. **Link this checkout to the remote project**:

   ```bash
   npm run db:link
   ```

4. **Apply all migrations** (creates the `feedback` table, the RLS policies,
   the `feedback-images` storage bucket, the `code` / `input_text` columns,
   and the admin setup — `admins` table, `is_admin()` helper, review
   `status` column, and admin read/update policies):

   ```bash
   npm run db:push
   ```

   `db push` asks for the project's **database password** (the one set when
   the project was created — not the anon/publishable key). You can also
   provide it non-interactively with `SUPABASE_DB_PASSWORD=... npm run db:push`.

## What the migrations create

- `public.feedback` — feedback submissions (category, message, email, page,
  algorithm, language, optional code + input JSON, optional screenshot URL,
  and a `status` column for triage: `new` / `read` / `resolved`). Insert-only
  RLS: anyone can submit. Admins (members of `public.admins`) can read rows
  and update `status` through the API.
- `public.admins` — admin user ids, looked up from `auth.users` by email.
  Locked down via RLS; membership is checked with the security-definer
  `public.is_admin()` function (called via RPC or from policy expressions).
  The migration promotes `loremipsum3003@gmail.com` and
  `amansinganamala@gmail.com`, and a trigger auto-promotes those emails if
  they sign up later.
- `storage` bucket `feedback-images` — public bucket for screenshots, with an
  insert-only policy for anyone.

## Admin feedback review

The `/admin` route (in the app) shows the feedback inbox plus a few metrics
(total/new/resolved, last-7-days, category breakdown, top pages & algorithms,
and actionability signals). It is gated server-side: the signed-in user must
be in `public.admins`, which the page checks with `supabase.rpc("is_admin")`.
The "Admin" button appears in the visualizer top bar for admins only.

## Verify

After pushing, check from the repo:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  "https://egcqvkcirxkynjaakrsr.supabase.co/rest/v1/feedback?select=id&limit=1"
```

A 401/403 means the table exists (RLS correctly blocking reads); a 404 means
the push hasn't run.
