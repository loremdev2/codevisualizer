# DSA Lab

A code visualizer for understanding what an algorithm is doing, one state at a time.

> **Setup & ops:** full environment, Google OAuth, Supabase, and Vercel configuration
> lives in [`SETUP.md`](./SETUP.md) — read it before deploying.

Paste an algorithm (or pick a preset), provide JSON input, and DSA Lab runs the code in a
sandboxed trace runner that captures every meaningful state change. Step forward, back, or
play through the animation while arrays, strings, hash maps, graphs, and recursive call
stacks are rendered as live visuals — no custom visualization code required.

Built for interview practice: sign in to save named solutions by topic and load them back
into the workspace whenever you want to practice.

## Features

- **Automatic tracing** — ordinary JavaScript is instrumented to infer state changes; no
  visualization API to learn.
- **Data structure rendering** — arrays as bars, strings with sliding windows, hash maps,
  graphs, queues/stacks, visited sets, and recursion frames.
- **Multi-language input** — JavaScript and TypeScript run natively, Python traces
  natively in-browser (Pyodide), and Java and C++ run through AI translation to
  instrumented JavaScript (sign-in required — those runs are paid LLM calls, gated
  behind a free account). Go, Rust, Ruby, Swift, Kotlin, C#, and PHP are on the roadmap
  and appear as "coming soon" in the language picker.
- **Start from a blank file** — "＋ New · Blank" in the preset dropdown (or the FilePlus
  button in the code panel header) clears the workspace so you can type your own
  algorithm from scratch; the editor explains the `input.*` contract until you type.
- **Step controls** — play/pause, step back/forward, jump to first/last, a timeline, and
  speed control.
- **Practice library** — Google sign-in, named saves under topics, and a collections page.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (Postgres + Storage only — Supabase Auth is not used) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only service-role key (Project Settings → API). Never expose to the client |
| `GOOGLE_CLIENT_ID` | Yes | OAuth client ID from Google Cloud Console (Web application) |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth client secret from Google Cloud Console |
| `SESSION_SECRET` | Yes | ≥32-char random string signing the httpOnly session cookie (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`) |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical origin for SEO — set to your domain once live |
| `NVIDIA_API_KEY` | No | NVIDIA NIM key (build.nvidia.com), used to translate Java, C++ and exotic TypeScript into instrumented JavaScript |
| `AI_TRANSLATION_HOURLY_LIMIT` | No | Signed-in AI translation cap per hour (default `10`; `0` = unlimited) |
| `AI_TRANSLATION_DAILY_LIMIT` | No | Signed-in AI translation cap per day (default `60`; `0` = unlimited) |
| `AI_TUTOR_HOURLY_LIMIT` | No | Signed-in step-tutor question cap per hour (default `20`; `0` = unlimited) |
| `AI_TUTOR_DAILY_LIMIT` | No | Signed-in step-tutor question cap per day (default `80`; `0` = unlimited) |
| `AI_TUTOR_MODEL` | No | Model for the step tutor (default: the translation model). Run `npm run ai:check` to list what your key can call |
| `AI_TUTOR_TIMEOUT_MS` | No | How long to wait for the tutor model (default `90000`, clamped to `5000`–`300000`) |

### Google OAuth setup

1. In Google Cloud Console create an **OAuth consent screen** (External) and an **OAuth
   client ID → Web application**.
2. Add the **Authorized redirect URI**: `http://localhost:3000/api/auth/callback` (dev)
   and `https://your-domain.com/api/auth/callback` (prod).
3. Put the client ID/secret in `.env.local`.
4. Run `supabase/migrations/20260813120000_direct_google_auth.sql` in the Supabase SQL
   editor (creates the `users` table, migrates existing auth users, moves admins onto
   `users.is_admin`).

The visualizer runs without any keys — only Google sign-in, saving collections, and
feedback need the configured env vars.

### Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
npm run test    # vitest unit tests
```

## Project structure

```
src/
  app/                 # Next.js App Router pages (/, /visualizer, /guide, /collections, /login, /admin)
    api/translate/     # NVIDIA NIM translation endpoint (emits //# line: directives)
    api/translate/usage/ # signed-in user's remaining AI translation quota
  components/          # UI: visualizer, canvas, auth, collections, saved-code controls, admin
  lib/
    detect-language.ts # language detection for the code input
    templates.ts       # built-in algorithm presets
    trace-runner.ts    # acorn-based instrumentation + the Web Worker trace runtime
    ai-usage.ts        # translation limits (env-configurable) + usage bucket math
    translation-cache.ts # client-side LRU cache for AI translations
    supabase/          # Supabase client setup
  types/visualizer.ts  # trace step and template types
supabase/              # Supabase config and migrations
```

The trace engine lives in `src/lib/trace-runner.ts`: `instrument()` rewrites user code with
acorn (capturing state changes, branch decisions, and recursive call-stack frames), and
`createWorkerSource()` builds the sandboxed Web Worker runtime that executes it with
networking disabled. Golden trace tests for every built-in template live in
`src/lib/trace-runner.test.ts` (`npm test`).

## Roadmap

See [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md) for the prioritized improvement plan
(reliability, tests, sharing, and growth features).
