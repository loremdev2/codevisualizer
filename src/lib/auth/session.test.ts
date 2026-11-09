import { describe, expect, it, beforeAll } from "vitest";

import { createSessionToken, verifySessionToken } from "./session";

const SECRET = "test-secret-that-is-long-enough-for-hs256-1234567890";

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});

describe("session tokens", () => {
  it("round-trips a payload", async () => {
    const token = await createSessionToken({
      sub: "user-1",
      email: "a@b.com",
      name: "A",
      picture: null,
    });
    const payload = await verifySessionToken(token);
    expect(payload).toEqual({
      sub: "user-1",
      email: "a@b.com",
      name: "A",
      picture: null,
    });
  });

  it("returns null for garbage", async () => {
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });

  it("rejects a tampered payload (signature mismatch)", async () => {
    const token = await createSessionToken({
      sub: "user-1",
      email: "a@b.com",
      name: "A",
      picture: null,
    });
    // Flip the sub claim without re-signing.
    const [header, , signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()), sub: "user-2" }),
    ).toString("base64url");
    const tampered = `${header}.${tamperedPayload}.${signature}`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects tokens signed with a different secret", async () => {
    process.env.SESSION_SECRET = "a-completely-different-secret-of-sufficient-length";
    const foreign = await createSessionToken({
      sub: "user-1",
      email: "a@b.com",
      name: "A",
      picture: null,
    });
    process.env.SESSION_SECRET = SECRET;
    expect(await verifySessionToken(foreign)).toBeNull();
  });
});
