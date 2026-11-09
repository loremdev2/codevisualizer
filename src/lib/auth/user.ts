import { getServiceClient } from "@/lib/db";
import type { GoogleProfile } from "@/lib/auth/google";

/**
 * The app's own users table (no auth.users). Keyed by the Google `sub`, so a
 * person is the same user across devices/sessions. Existing Supabase-Auth-era
 * rows were migrated with their original auth.users id (see migration), which
 * is why this table still uses uuid ids.
 */
export type DbUser = {
  id: string;
  google_sub: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

/**
 * Derive the default username from the email's local part: lowercase,
 * letters/digits/underscores only, 3-30 chars. Disallowed characters become
 * underscores; short local parts get underscore-padded so the column's
 * validation rules are always satisfied. Users can change it later from
 * their profile.
 */
export function deriveUsernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  let base = local.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30);
  while (base.length < 3) base += "_";
  return base;
}

/** Emails that are admins automatically (matched case-insensitively at signup). */
export const ADMIN_EMAILS = ["loremipsum3003@gmail.com", "amansinganamala@gmail.com"];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === email.toLowerCase());
}

/**
 * Find a free username by appending numeric suffixes to a taken base handle
 * (e.g. "john_doe" → "john_doe_2", "john_doe_3", ...). Returns the base
 * itself if every candidate is somehow taken — the unique-violation retry
 * below is the safety net for that.
 */
async function findFreeUsername(
  supabase: ReturnType<typeof getServiceClient>,
  base: string,
): Promise<string> {
  for (let n = 2; n <= 100; n++) {
    const candidate = (base + `_${n}`).slice(-30);
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return base;
}

/** Find-or-create the user for a verified Google profile. */
export async function upsertUserFromGoogle(profile: GoogleProfile): Promise<DbUser> {
  const supabase = getServiceClient();
  const isAdmin = isAdminEmail(profile.email);

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("google_sub", profile.sub)
    .maybeSingle();

  if (existing) {
    const { data: updated } = await supabase
      .from("users")
      .update({
        email: profile.email,
        name: profile.name,
        avatar_url: profile.picture,
        is_admin: existing.is_admin || isAdmin,
        last_sign_in_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    return (updated ?? existing) as DbUser;
  }

  // A user who signed up before this migration keeps their original id (the
  // migration copied auth.users rows with their ids); for everyone else
  // Postgres generates a fresh uuid.
  const { data: migrated } = await supabase
    .from("users")
    .select("*")
    .eq("email", profile.email.toLowerCase())
    .maybeSingle();

  if (migrated) {
    const { data: updated } = await supabase
      .from("users")
      .update({
        google_sub: profile.sub,
        name: profile.name,
        avatar_url: profile.picture,
        is_admin: migrated.is_admin || isAdmin,
        last_sign_in_at: new Date().toISOString(),
      })
      .eq("id", migrated.id)
      .select("*")
      .single();
    return (updated ?? migrated) as DbUser;
  }

  // New account: auto-assign a username derived from the email (the old
  // "pick a username on first login" prompt is gone). If the handle is taken,
  // append a numeric suffix. This must never block sign-up — see the retry
  // below for why.
  const email = profile.email.toLowerCase();
  const baseUsername = deriveUsernameFromEmail(email);
  const { data: usernameTaken } = await supabase
    .from("users")
    .select("id")
    .eq("username", baseUsername)
    .maybeSingle();
  const username = usernameTaken ? await findFreeUsername(supabase, baseUsername) : baseUsername;

  const insertWithoutUsername = () =>
    supabase
      .from("users")
      .insert({
        google_sub: profile.sub,
        email,
        name: profile.name,
        avatar_url: profile.picture,
        is_admin: isAdmin,
        last_sign_in_at: new Date().toISOString(),
      })
      .select("*")
      .single();

  const { data: created, error } = await supabase
    .from("users")
    .insert({
      google_sub: profile.sub,
      email,
      name: profile.name,
      username,
      avatar_url: profile.picture,
      is_admin: isAdmin,
      last_sign_in_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !created) {
    // The username is cosmetic — it must never fail a sign-in. A raced
    // unique violation (two people with the same email prefix signing up at
    // once) or a database where the username migration hasn't been applied
    // both surface here. Retry once without the username: the user ends up
    // with a NULL handle and can pick one from their profile later. If the
    // retry fails too, the underlying error is real — surface it.
    console.error("User insert with username failed, retrying without one:", error?.message);
    const retry = await insertWithoutUsername();
    if (retry.error || !retry.data) {
      throw new Error(retry.error?.message ?? error?.message ?? "Couldn't create the user record.");
    }
    return retry.data as DbUser;
  }

  return created as DbUser;
}

/** Fresh admin flag for a user id (the session cookie is never trusted alone). */
export async function getUserById(id: string): Promise<DbUser | null> {
  const { data } = await getServiceClient()
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as DbUser | null) ?? null;
}
