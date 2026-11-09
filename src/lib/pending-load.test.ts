import { describe, expect, it } from "vitest";

import { createPendingLoadStore } from "./pending-load";

const payload = { code: "const x = 1;", inputText: "{}" };

describe("pending-load store (Load→Run race fix)", () => {
  it("starts empty", () => {
    const store = createPendingLoadStore();
    expect(store.consume()).toBeNull();
  });

  it("returns a staged payload and falls back to the current buffer when empty", () => {
    const store = createPendingLoadStore();
    store.set(payload);
    // Mirrors runTrace: `pendingLoad?.code ?? code`.
    const pending = store.consume();
    expect(pending).toEqual(payload);
    expect(pending?.code ?? "stale").toBe("const x = 1;");
    expect(pending?.inputText ?? "stale").toBe("{}");
  });

  it("consume is one-shot — the payload never leaks into a later run", () => {
    const store = createPendingLoadStore();
    store.set(payload);
    store.consume();
    expect(store.consume()).toBeNull();
  });

  it("clear() drops the payload (user edits code after Load)", () => {
    const store = createPendingLoadStore();
    store.set(payload);
    store.clear();
    expect(store.consume()).toBeNull();
  });

  it("a fresh set() replaces a previous one (Load followed by another Load)", () => {
    const store = createPendingLoadStore();
    store.set({ code: "first", inputText: "{}" });
    store.set({ code: "second", inputText: "{ }" });
    expect(store.consume()?.code).toBe("second");
  });
});
