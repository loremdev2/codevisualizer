# DSA Lab — Setup & Maintenance

Everything needed to run, deploy, and operate DSA Lab after moving **off Supabase Auth**
onto **direct Google OAuth** (server-side PKCE) with a first-party session cookie.

---

## 1. Architecture in one paragraph

There is **no Supabase Auth** anymore. Google sign-in is handled directly by the app:

```
Browser ──▶ /api/auth/google ──▶ accounts.google.com (PKCE challenge)
   ▲                                    │ user approves
   │                                    ▼
   │                            /api/auth/callback
   │                          (server exchanges code,
   │                           verifies Google ID-token signature,
   │                           finds/creates user in `users` table,
   │                           mints httpOnly session cookie)
   │                                    │
   └────────────── session cookie ◀────┘
```

- **Identity** = the `users` table (Supabase is used as plain Postgres + Storage).
- **Authorization** = every API route verifies the session cookie and scopes queries
  to the user id. All DB access goes through the **service-role key server-side** —
  the browser never talks to Supabase directly anymore.
- **Sessions** = a stateless HS256 JWT (`SESSION_SECRET`) in an httpOnly,
  SameSite=Lax, Secure (prod) cookie named `dsa_session`, valid 30 days.

---

## 2. Environment variables

### Required (both dev and Vercel)

| Variable | Server-only? | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | no | `https://<ref>.supabase.co` — Postgres/Storage only |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | Supabase → Project Settings → API → `service_role` key |
| `GOOGLE_CLIENT_ID` | **yes** | Google Cloud Console → Credentials → OAuth client (Web) |
| `GOOGLE_CLIENT_SECRET` | **yes** | Same OAuth client's secret |
| `SESSION_SECRET` | **yes** | ≥32-char random string signing the session cookie |

Generate a secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Optional

| Variable | Server-only? | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical origin for sitemap/robots/OpenGraph (set once the domain is live) |
| `NVIDIA_API_KEY` | **yes** | NVIDIA NIM key (free tier at build.nvidia.com) — translates Java, C++, and exotic TypeScript into instrumented JS |
| `AI_TRANSLATION_HOURLY_LIMIT` | **yes** | Signed-in AI translation cap per hour (default `10`, `0` = unlimited) |
| `AI_TRANSLATION_DAILY_LIMIT` | **yes** | Signed-in AI translation cap per day (default `60`, `0` = unlimited) |
| `AI_TUTOR_HOURLY_LIMIT` | **yes** | Signed-in step-tutor question cap per hour (default `20`, `0` = unlimited) |
| `AI_TUTOR_DAILY_LIMIT` | **yes** | Signed-in step-tutor question cap per day (default `80`, `0` = unlimited) |
| `AI_TUTOR_MODEL` | **yes** | Model for the step tutor (default: the translation model) |
| `AI_TUTOR_TIMEOUT_MS` | **yes** | How long to wait for the tutor model (default `90000`) |

> Run `npm run ai:check` if AI features fail: it probes each candidate model with a
> tiny prompt and reports which ones your key can actually call, plus their latency.
> A model that isn't enabled for the account answers `404 "Function not found for
> account"`, and a too-slow one answers nothing at all — both look like a broken
> route otherwise. Set `AI_TUTOR_MODEL` to a model that passes the probe.
>
> Rate limits are read on every request from `src/lib/ai-usage.ts` — changing the env
> vars takes effect without a deploy. Guests can't use Java/C++ at all (server-enforced 403);
> signed-in users get the caps above, and identical runs are served from a Postgres cache
> before the quota is touched. The step tutor (`/api/tutor`) requires sign-in too, has no
> cache (answers depend on the conversation), and counts against the same hourly/daily
> buckets — so one shared AI budget per user, with the tighter limit binding.

### No longer needed (safe to remove)

- **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** — the anon/publishable key was only used by
  the old Supabase-Auth client code, which no longer exists. Remove it from Vercel.

> ⚠️ **Never** prefix `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`, or
> `SESSION_SECRET` with `NEXT_PUBLIC_` in Vercel — those are server-only secrets and
> `NEXT_PUBLIC_*` variables are shipped to every browser.

---

## 3. Google Cloud Console

1. **APIs & Services → OAuth consent screen** → External.
   - App name: `DSA Lab`, your support email.
   - While in *Testing* mode only accounts you add as **Test users** can sign in.
     Publish to **In production** before launch (`email`/`profile`/`openid` need no verification).
2. **Credentials → Create credentials → OAuth client ID → Web application.**
3. **Authorized redirect URIs** must contain exactly:
   ```
   http://localhost:3000/api/auth/callback          (local dev)
   https://code-visualizer-kappa.vercel.app/api/auth/callback   (Vercel prod)
   https://your-domain.com/api/auth/callback        (once you buy a domain)
   ```
   The app always redirects back to its own origin, so a URL is needed per environment.
4. Copy **Client ID** + **Client Secret** into `.env.local` (dev) and Vercel.

---

## 4. Supabase (database + storage only)

### Migrations — run in order in the Supabase SQL Editor (Dashboard → SQL Editor)

| File | When | What it does |
| --- | --- | --- |
| `20260808080816_create_saved_algorithms.sql` | first setup | saved-algorithms table |
| `20260812090000_create_feedback.sql` | first setup | feedback table |
| `20260812120000_feedback_images.sql` | first setup | `feedback-images` storage bucket |
| `20260812130000_feedback_code.sql` | first setup | code/input columns on feedback |
| `20260812140000_feedback_admins.sql` | first setup | admin gating (replaced later — see next row) |
| `20260813100000_feedback_trace_context.sql` | applied | trace context columns on feedback |
| **`20260813120000_direct_google_auth.sql`** | **applied — the big one** | creates `users`, migrates `auth.users` in (ids preserved), re-points FKs, moves admins to `users.is_admin`, drops `admins`/`is_admin()` |
| **`20260813130000_harden_users_rls.sql`** | **must run** | **security fix** — closes `users` to the public anon key (Supabase default privileges exposed it: emails readable, `is_admin` writable). Enables RLS + revokes anon/authenticated grants |
| **`20260814120000_create_trace_reports.sql`** | **must run** | `trace_reports` table for one-click "This trace was wrong" flags (code hash + run context, insert-only RLS) |
| **`20260815100000_create_ai_translation_usage.sql`** | **must run** | `ai_translation_usage` table + atomic `bump_ai_usage` fn — the hourly/daily spend caps |
| **`20260815110000_create_ai_translation_cache.sql`** | **must run** | `ai_translation_cache` table (language+code+input hash → translated JS) + `bump_cache_hits` fn |
| **`20260815120000_create_ai_translation_denials.sql`** | **must run** | `ai_translation_denials` table + summary/usage-by-user SQL fns for the admin spend dashboard |

All are idempotent. The last migration is the one that removes Supabase Auth — run it
**before** testing sign-in, or the callback can't find the `users` table.

### Admins

Admins are `users.is_admin = true`. The app auto-promotes these emails at signup:

```
loremipsum3003@gmail.com
amansinganamala@gmail.com
```

To add/remove an admin later, edit `ADMIN_EMAILS` in `src/lib/auth/user.ts`, or flip the
flag in the database (`update users set is_admin = true where email = '...'`). The
`is_admin` flag is re-read from the DB on every admin request — the cookie is never
trusted for it.

---

## 5. Vercel deployment

Env vars to have in Vercel (see table in §2):

- **Keep:** `NEXT_PUBLIC_SUPABASE_URL`, `NVIDIA_API_KEY`, `NEXT_PUBLIC_SITE_URL`
- **Add (server-only):** `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`
- **Optional:** `AI_TRANSLATION_HOURLY_LIMIT`, `AI_TRANSLATION_DAILY_LIMIT` (defaults 10/60),
  `AI_TUTOR_HOURLY_LIMIT`, `AI_TUTOR_DAILY_LIMIT` (defaults 20/80)
- **Remove:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (unused)

The production redirect URI `https://code-visualizer-kappa.vercel.app/api/auth/callback`
is already registered in the Google client (verified), so no Google Console change is
needed for the current Vercel domain.

---

## 6. Day-to-day operations

- **New DB tables/columns** → add a migration file in `supabase/migrations/` and run it
  in the Supabase SQL editor. There is no automatic migration runner.
- **Feedback inbox** → `/admin` (signed-in admins only). Rows land in the `feedback`
  table; screenshots in the `feedback-images` bucket.
- **AI spend dashboard** → same `/admin` page, above the feedback list: cache hit rate,
  signed-in LLM calls, per-user translation usage (last 7 days), and recent 429 denials
  with retry-after. Zeroes/empty until the three `..._ai_translation_*.sql` migrations
  are applied (everything fails open meanwhile).
- **Rotate a secret** (e.g. after it leaks) → generate a new value, update `.env.local`
  + Vercel, restart. Session cookies signed with the old secret become invalid —
  users just sign in again.
- **Delete a user** → `delete from users where email = '...'` cascades to their saved
  algorithms; feedback keeps the row with a null user.

## 7. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `auth_error=auth_failed` after consent | Google token exchange or `users` insert failed — check server logs; make sure migration `20260813120000` ran |
| `auth_error=state_mismatch` | The OAuth state cookie expired (10 min) or was cleared — just retry sign-in |
| `auth_error=missing_code` | Directly opened the callback URL without a code — normal, not a bug |
| "Google sign-in is not configured yet" | `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` missing |
| `PGRST205: table not found` | A migration hasn't been applied — run it in the SQL editor |
| "invalid_grant" from Google | `redirect_uri` doesn't exactly match a registered URI (check scheme, host, port) |
| Sign-in works but admin page redirects to `/` | Your account isn't in `ADMIN_EMAILS` (or `is_admin` is false in `users`) |

## 8. Golden rules

- The service-role key, Google client secret, and session secret live **only** in
  server env vars — never `NEXT_PUBLIC_*`, never in client code, never committed.
  `.env.local` is gitignored.
- Never paste a secret into a chat or issue; if one leaks, rotate it (§6).
- The session cookie is `httpOnly` + `SameSite=Lax`; keep it that way — nothing in the
  browser should be able to read it.
