import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the service client and session before importing the route handlers.
// ---------------------------------------------------------------------------

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockMaybeSingle = vi.fn();

function setupSupabaseMock() {
  // Chainable query builder mock.
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    maybeSingle: mockMaybeSingle,
  };

  // Each method returns the chain itself so calls can be chained.
  for (const fn of Object.values(chain)) {
    fn.mockReturnValue(chain);
  }

  return chain;
}

let supabaseChain: ReturnType<typeof setupSupabaseMock>;
let mockGetSessionUserId: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();

  supabaseChain = setupSupabaseMock();

  vi.doMock("@/lib/db", () => ({
    getServiceClient: () => ({
      from: vi.fn(() => supabaseChain),
    }),
  }));

  mockGetSessionUserId = vi.fn();
  vi.doMock("@/lib/auth/session", () => ({
    getSessionUserId: mockGetSessionUserId,
  }));
});

// Helper to create a mock NextRequest with search params.
function makeRequest(
  method: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>,
): { json: () => Promise<Record<string, unknown>>; cookies: { get: () => undefined }; nextUrl: URL } {
  const url = new URL("http://localhost/api/me/solved-questions");
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  return {
    json: () => Promise.resolve(body ?? {}),
    cookies: { get: () => undefined },
    nextUrl: url,
  } as never;
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

describe("GET /api/me/solved-questions", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSessionUserId.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET(makeRequest("GET") as never);
    expect(res.status).toBe(401);
  });

  it("returns the solved set for an authenticated user", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");
    mockOrder.mockReturnValue({
      ...supabaseChain,
      then: undefined, // prevent auto-unwrap
    });
    // Override select to return data.
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ question_no: 1 }, { question_no: 88 }],
            error: null,
          }),
        }),
      }),
    });

    const { GET } = await import("./route");
    const res = await GET(makeRequest("GET") as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.solved).toEqual([1, 88]);
    expect(json.bank).toBe("top150");
  });

  it("accepts a bank query parameter", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");
    mockOrder.mockReturnValue({
      ...supabaseChain,
      then: undefined,
    });
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ question_no: 42 }],
            error: null,
          }),
        }),
      }),
    });

    const { GET } = await import("./route");
    const res = await GET(makeRequest("GET", undefined, { bank: "neetcode" }) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.solved).toEqual([42]);
    expect(json.bank).toBe("neetcode");
  });

  it("defaults to top150 for unknown bank", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");
    mockOrder.mockReturnValue({
      ...supabaseChain,
      then: undefined,
    });
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    const { GET } = await import("./route");
    const res = await GET(makeRequest("GET", undefined, { bank: "unknown" }) as never);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.bank).toBe("top150");
  });
});

// ---------------------------------------------------------------------------
// PUT
// ---------------------------------------------------------------------------

describe("PUT /api/me/solved-questions", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSessionUserId.mockResolvedValue(null);
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", { question_no: 88 }) as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid question_no", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");
    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", { question_no: -5 }) as never);
    expect(res.status).toBe(400);
  });

  it("inserts a new solved question and returns the fresh set", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");

    // insert succeeds (no PK conflict).
    mockInsert.mockResolvedValue({ error: null });

    // fetchSolved returns the fresh set.
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ question_no: 88 }],
            error: null,
          }),
        }),
      }),
    });

    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", { question_no: 88 }) as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.solved).toEqual([88]);
    expect(json.bank).toBe("top150");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      bank: "top150",
      question_no: 88,
    });
  });

  it("accepts a bank parameter in the body", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");
    mockInsert.mockResolvedValue({ error: null });

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{ question_no: 42 }],
            error: null,
          }),
        }),
      }),
    });

    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", { question_no: 42, bank: "neetcode" }) as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.bank).toBe("neetcode");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      bank: "neetcode",
      question_no: 42,
    });
  });

  it("deletes an existing solved question on PK conflict (atomic toggle)", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");

    // insert fails with unique_violation (23505).
    mockInsert.mockResolvedValue({
      error: { code: "23505", message: "duplicate key" },
    });

    // delete succeeds.
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    // fetchSolved returns empty set (question was removed).
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    const { PUT } = await import("./route");
    const res = await PUT(makeRequest("PUT", { question_no: 88 }) as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.solved).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

describe("DELETE /api/me/solved-questions", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSessionUserId.mockResolvedValue(null);
    const { DELETE } = await import("./route");
    const res = await DELETE(makeRequest("DELETE") as never);
    expect(res.status).toBe(401);
  });

  it("deletes all solved questions and returns empty set", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");

    // delete succeeds.
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const { DELETE } = await import("./route");
    const res = await DELETE(makeRequest("DELETE") as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.solved).toEqual([]);
    expect(json.bank).toBe("top150");
  });

  it("accepts a bank query parameter for scoped delete", async () => {
    mockGetSessionUserId.mockResolvedValue("user-1");

    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const { DELETE } = await import("./route");
    const res = await DELETE(makeRequest("DELETE", undefined, { bank: "neetcode" }) as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.bank).toBe("neetcode");
  });
});
