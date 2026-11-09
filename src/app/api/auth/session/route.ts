import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/user";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  isAdmin: boolean;
};

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });

  const payload = await verifySessionToken(token);
  if (!payload) return NextResponse.json({ user: null });

  // Fresh admin flag from the database — never trust the cookie alone.
  const dbUser = await getUserById(payload.sub);
  if (!dbUser) return NextResponse.json({ user: null });

  const user: SessionUser = {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name ?? payload.name,
    picture: dbUser.avatar_url ?? payload.picture,
    isAdmin: dbUser.is_admin,
  };
  return NextResponse.json({ user });
}
