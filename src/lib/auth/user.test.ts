import { describe, expect, it, vi, beforeEach } from "vitest";

import { deriveUsernameFromEmail, type DbUser } from "./user";
import type { GoogleProfile } from "@/lib/auth/google";

// `upsertUserFromGoogle` must be imported dynamically AFTER vi.doMock so the
// mocked @/lib/db is what user.ts binds to (same pattern as route tests).
async function loadUpsert(): Promise<typeof import("./user")> {
  return import("./user");
}

// ---------------------------------------------------------------------------
// deriveUsernameFromEmail — pure function, tested directly.
// ---------------------------------------------------------------------------

describe("deriveUsernameFromEmail", () => {
  it("uses the email local part as-is when already valid", () => {
    expect(deriveUsernameFromEmail("john_doe@gmail.com")).toBe("john_doe");
  });

  it("lowercases the local part", () => {
    expect(deriveUsernameFromEmail("JohnDoe@Gmail.com")).toBe("johndoe");
  });

  it("ignores everything after the @", () => {
    expect(deriveUsernameFromEmail("johndoe@anything.example.co.uk")).toBe("johndoe");
  });

  it("maps disallowed characters to underscores", () => {
    // Dots, plus-tags, and hyphens are common in real emails.
    expect(deriveUsernameFromEmail("first.last+tag@gmail.com")).toBe("first_last_tag");
    expect(deriveUsernameFromEmail("odd-user!name@gmail.com")).toBe("odd_user_name");
  });

  it("caps at 30 characters", () => {
    const long = "a".repeat(50);
    expect(deriveUsernameFromEmail(`${long}@gmail.com`)).toHaveLength(30);
    expect(deriveUsernameFromEmail(`${long}@gmail.com`)).toBe("a".repeat(30));
  });

  it("pads local parts shorter than 3 chars with underscores", () => {
    expect(deriveUsernameFromEmail("ab@gmail.com")).toBe("ab_");
    expect(deriveUsernameFromEmail("a@gmail.com")).toBe("a__");
  });

  it("handles a fully-invalid local part by padding underscores", () => {
    expect(deriveUsernameFromEmail("!!@gmail.com")).toBe("___");
  });

  it("handles an email with no local part", () => {
    expect(deriveUsernameFromEmail("@gmail.com")).toBe("___");
  });
});

// ---------------------------------------------------------------------------
// upsertUserFromGoogle — username collision + fallback paths.
//
// The Supabase client is mocked with a tiny in-memory table so the
// select/insert chains resolve against shared state, letting tests observe
// the collision retry behavior end-to-end.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

type Table = {
  rows: Row[];
  // Programs the outcome of the next insert call (subsequent ones fall back
  // to success) — used to simulate a unique-constraint race.
  failNextInsertWith?: { message: string };
};

const state: { users: Table; calledInserts: Row[] } = {
  users: { rows: [] },
  calledInserts: [],
};

function makeSupabaseMock() {
  const insert = vi.fn((payload: Row) => {
    state.calledInserts.push(payload);
    if (state.users.failNextInsertWith) {
      const error = state.users.failNextInsertWith;
      state.users.failNextInsertWith = undefined;
      return { select: () => ({ single: async () => ({ data: null, error }) }) };
    }
    // Simulate the DB's unique constraint on username + email.
    const conflict =
      state.users.rows.some((r) => r.username === payload.username && payload.username != null) ||
      state.users.rows.some((r) => r.email === payload.email);
    if (conflict) {
      return {
        select: () => ({
          single: async () => ({
            data: null,
            error: { message: 'duplicate key value violates unique constraint "users_username_key"' },
          }),
        }),
      };
    }
    // Model the real table: username is a nullable column, so a row inserted
    // without one reads back as NULL.
    const row: Row = { username: null, ...payload, id: `id-${state.users.rows.length + 1}` };
    state.users.rows.push(row);
    return { select: () => ({ single: async () => ({ data: row, error: null }) }) };
  });

  const select = vi.fn((columns: string) => ({
    eq: (column: string, value: unknown) => ({
      maybeSingle: async () => {
        void columns;
        const row = state.users.rows.find((r) => r[column] === value);
        return { data: row ?? null, error: null };
      },
    }),
  }));

  const update = vi.fn(() => ({
    eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
  }));

  return {
    from: vi.fn((_table: string) => ({ insert, select, update })),
  };
}

function makeProfile(overrides?: Partial<GoogleProfile>): GoogleProfile {
  return {
    sub: "google-sub-1",
    email: "john_doe@gmail.com",
    name: "John Doe",
    picture: null,
    emailVerified: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  state.users = { rows: [] };
  state.calledInserts = [];
});

describe("upsertUserFromGoogle — new user username assignment", () => {
  it("creates the account with the email-derived username", async () => {
    const supabase = makeSupabaseMock();
    vi.doMock("@/lib/db", () => ({ getServiceClient: () => supabase }));
    const { upsertUserFromGoogle } = await loadUpsert();

    const user = await upsertUserFromGoogle(makeProfile());

    expect(user.username).toBe("john_doe");
    expect(state.users.rows).toHaveLength(1);
  });

  it("appends a numeric suffix when the derived username is taken", async () => {
    state.users.rows.push({ id: "other", email: "other@gmail.com", username: "john_doe" });
    const supabase = makeSupabaseMock();
    vi.doMock("@/lib/db", () => ({ getServiceClient: () => supabase }));
    const { upsertUserFromGoogle } = await loadUpsert();

    const user = await upsertUserFromGoogle(makeProfile());

    expect(user.username).toBe("john_doe_2");
  });

  it("keeps searching suffixes past the first taken candidate", async () => {
    state.users.rows.push(
      { id: "a", email: "a@gmail.com", username: "john_doe" },
      { id: "b", email: "b@gmail.com", username: "john_doe_2" },
      { id: "c", email: "c@gmail.com", username: "john_doe_3" },
    );
    const supabase = makeSupabaseMock();
    vi.doMock("@/lib/db", () => ({ getServiceClient: () => supabase }));
    const { upsertUserFromGoogle } = await loadUpsert();

    const user = await upsertUserFromGoogle(makeProfile());

    expect(user.username).toBe("john_doe_4");
  });

  it("caps the candidate to 30 chars when appending the suffix", async () => {
    // 30-char base + "_2" would be 32 — the suffix branch truncates from the left.
    const longBase = "u".repeat(30);
    state.users.rows.push({ id: "a", email: "a@gmail.com", username: longBase });
    const supabase = makeSupabaseMock();
    vi.doMock("@/lib/db", () => ({ getServiceClient: () => supabase }));
    const { upsertUserFromGoogle } = await loadUpsert();

    const user = await upsertUserFromGoogle(makeProfile({ email: `${longBase}@gmail.com` }));

    expect(user.username).toHaveLength(30);
    expect(user.username).toMatch(/^u+_\d+$/);
  });

  it("retries without a username when the insert hits a unique violation", async () => {
    // Simulate a raced unique-constraint failure on the first insert only.
    state.users.failNextInsertWith = {
      message: 'duplicate key value violates unique constraint "users_username_key"',
    };
    const supabase = makeSupabaseMock();
    vi.doMock("@/lib/db", () => ({ getServiceClient: () => supabase }));
    const { upsertUserFromGoogle } = await loadUpsert();

    const user = await upsertUserFromGoogle(makeProfile());

    expect(user.username).toBeNull();
    expect(state.calledInserts).toHaveLength(2);
    expect(state.calledInserts[0].username).toBe("john_doe");
    expect("username" in state.calledInserts[1]).toBe(false);
    expect(state.users.rows).toHaveLength(1);
  });

  it("retries without a username when the DB lacks the username column", async () => {
    // Simulates migrations not yet applied: undefined column error.
    state.users.failNextInsertWith = {
      message: 'column users.username of relation "users" does not exist',
    };
    const supabase = makeSupabaseMock();
    vi.doMock("@/lib/db", () => ({ getServiceClient: () => supabase }));
    const { upsertUserFromGoogle } = await loadUpsert();

    const user = await upsertUserFromGoogle(makeProfile());

    expect(user.username).toBeNull();
    expect(state.calledInserts).toHaveLength(2);
  });

  it("throws when the retry insert also fails (real error surfaces)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = makeSupabaseMock();
    // Make every insert fail with the same non-recoverable error.
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: async () => ({ data: null, error: { message: "connection refused" } }),
        }),
      }),
      update: vi.fn(),
    }) as never);
    vi.doMock("@/lib/db", () => ({ getServiceClient: () => supabase }));
    const { upsertUserFromGoogle } = await loadUpsert();

    await expect(upsertUserFromGoogle(makeProfile())).rejects.toThrow("connection refused");
  });

  it("updates an existing user (by google_sub) without touching their username", async () => {
    state.users.rows.push({
      id: "existing",
      google_sub: "google-sub-1",
      email: "old@gmail.com",
      username: "keeper",
      is_admin: false,
    });
    const supabase = makeSupabaseMock();
    vi.doMock("@/lib/db", () => ({ getServiceClient: () => supabase }));
    const { upsertUserFromGoogle } = await loadUpsert();

    const user = await upsertUserFromGoogle(makeProfile());

    expect(state.calledInserts).toHaveLength(0);
    expect(user.username).toBe("keeper");
  });

  it("claims a migrated row by email and does not overwrite its username", async () => {
    state.users.rows.push({
      id: "migrated",
      email: "john_doe@gmail.com",
      username: "legacy_handle",
      is_admin: false,
    });
    const supabase = makeSupabaseMock();
    vi.doMock("@/lib/db", () => ({ getServiceClient: () => supabase }));
    const { upsertUserFromGoogle } = await loadUpsert();

    const user = await upsertUserFromGoogle(makeProfile());

    expect(state.calledInserts).toHaveLength(0);
    expect(user.username).toBe("legacy_handle");
  });
});

// Type-level guard: DbUser keeps its username field optional-friendly.
describe("DbUser", () => {
  it("accepts a null username", () => {
    const user: DbUser = {
      id: "1",
      google_sub: "s",
      email: "e@x.com",
      name: null,
      username: null,
      avatar_url: null,
      is_admin: false,
      created_at: new Date().toISOString(),
      last_sign_in_at: null,
    };
    expect(user.username).toBeNull();
  });
});
