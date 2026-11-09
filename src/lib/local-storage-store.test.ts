import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLocalStorageStore } from "./local-storage-store";

// ---------------------------------------------------------------------------
// Minimal localStorage mock backed by a plain Map.
// ---------------------------------------------------------------------------

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
  };
}

let localStorage: ReturnType<typeof createLocalStorageMock>;
let dispatchedEvents: string[];
const eventListeners = new Map<string, Set<EventListener>>();

beforeEach(() => {
  localStorage = createLocalStorageMock();
  dispatchedEvents = [];
  eventListeners.clear();

  (globalThis as Record<string, unknown>).window = {
    localStorage,
    dispatchEvent: (event: Event) => {
      dispatchedEvents.push(event.type);
      const listeners = eventListeners.get(event.type);
      if (listeners) {
        for (const listener of listeners) listener(event);
      }
      return true;
    },
    addEventListener: (type: string, listener: EventListener) => {
      if (!eventListeners.has(type)) eventListeners.set(type, new Set());
      eventListeners.get(type)!.add(listener);
    },
    removeEventListener: (type: string, listener: EventListener) => {
      eventListeners.get(type)?.delete(listener);
    },
  } as unknown as Window;
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Basic read/write
// ---------------------------------------------------------------------------

describe("createLocalStorageStore", () => {
  it("returns default value when localStorage is empty", () => {
    const store = createLocalStorageStore({
      key: "test-key",
      eventName: "test-event",
      defaultValue: "fallback",
      deserialize: (raw) => raw,
    });
    expect(store.read()).toBe("fallback");
  });

  it("reads value from localStorage", () => {
    localStorage.setItem("test-key", "hello");
    const store = createLocalStorageStore({
      key: "test-key",
      eventName: "test-event",
      defaultValue: "fallback",
      deserialize: (raw) => raw,
    });
    expect(store.read()).toBe("hello");
  });

  it("writes value to localStorage", () => {
    const store = createLocalStorageStore({
      key: "test-key",
      eventName: "test-event",
      defaultValue: "",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    store.set("written");
    // Default serialize is JSON.stringify, so strings are quoted
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("written"));
    expect(store.read()).toBe("written");
  });

  it("removes key on reset", () => {
    localStorage.setItem("test-key", "value");
    const store = createLocalStorageStore({
      key: "test-key",
      eventName: "test-event",
      defaultValue: "fallback",
      deserialize: (raw) => raw,
    });
    store.reset();
    expect(localStorage.getItem("test-key")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Serialization / deserialization
// ---------------------------------------------------------------------------

describe("serialization", () => {
  it("uses custom serialize/deserialize for objects", () => {
    const store = createLocalStorageStore<Record<string, number>>({
      key: "obj-key",
      eventName: "obj-event",
      defaultValue: {},
      deserialize: (raw) => JSON.parse(raw) as Record<string, number>,
      serialize: (v) => JSON.stringify(v),
    });
    store.set({ count: 42 });
    expect(JSON.parse(localStorage.getItem("obj-key")!)).toEqual({ count: 42 });
    expect(store.read()).toEqual({ count: 42 });
  });

  it("uses default JSON serialization when not specified", () => {
    const store = createLocalStorageStore<number[]>({
      key: "arr-key",
      eventName: "arr-event",
      defaultValue: [],
      deserialize: (raw) => JSON.parse(raw) as number[],
    });
    store.set([1, 2, 3]);
    expect(localStorage.getItem("arr-key")).toBe("[1,2,3]");
    expect(store.read()).toEqual([1, 2, 3]);
  });

  it("handles custom boolean serialization", () => {
    const store = createLocalStorageStore<boolean>({
      key: "bool-key",
      eventName: "bool-event",
      defaultValue: true,
      // Custom deserialize: compare raw string to "false"
      deserialize: (raw) => JSON.parse(raw) as boolean,
      serialize: (v) => JSON.stringify(v),
    });
    store.set(false);
    expect(localStorage.getItem("bool-key")).toBe("false");
    expect(store.read()).toBe(false);
  });

  it("handles default JSON serialization for booleans", () => {
    const store = createLocalStorageStore<boolean>({
      key: "bool-json-key",
      eventName: "bool-json-event",
      defaultValue: true,
      deserialize: (raw) => JSON.parse(raw) as boolean,
    });
    store.set(false);
    expect(localStorage.getItem("bool-json-key")).toBe("false");
    expect(store.read()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

describe("cache invalidation", () => {
  it("caches the snapshot between reads", () => {
    localStorage.setItem("cache-key", JSON.stringify("value1"));
    const store = createLocalStorageStore({
      key: "cache-key",
      eventName: "cache-event",
      defaultValue: "",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    const first = store.read();
    // Change localStorage directly (simulates cross-tab write)
    localStorage.setItem("cache-key", JSON.stringify("value2"));
    // Should still return cached value (no subscriber notified yet)
    expect(store.read()).toBe("value1");
  });

  it("invalidates cache on set()", () => {
    localStorage.setItem("cache-key", JSON.stringify("value1"));
    const store = createLocalStorageStore({
      key: "cache-key",
      eventName: "cache-event",
      defaultValue: "",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    store.read(); // prime cache
    store.set("value2");
    expect(store.read()).toBe("value2");
  });

  it("invalidates cache on reset()", () => {
    localStorage.setItem("cache-key", JSON.stringify("value1"));
    const store = createLocalStorageStore({
      key: "cache-key",
      eventName: "cache-event",
      defaultValue: "fallback",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    store.read(); // prime cache
    store.reset();
    expect(store.read()).toBe("fallback");
  });
});

// ---------------------------------------------------------------------------
// Subscribe / notify
// ---------------------------------------------------------------------------

describe("subscribe", () => {
  it("notifies subscribers on set()", () => {
    const store = createLocalStorageStore({
      key: "sub-key",
      eventName: "sub-event",
      defaultValue: "",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set("new-value");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(dispatchedEvents).toContain("sub-event");

    unsubscribe();
  });

  it("notifies subscribers on reset()", () => {
    const store = createLocalStorageStore({
      key: "sub-key",
      eventName: "sub-event",
      defaultValue: "",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.reset();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(dispatchedEvents).toContain("sub-event");

    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const store = createLocalStorageStore({
      key: "sub-key",
      eventName: "sub-event",
      defaultValue: "",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    store.set("new-value");
    expect(listener).not.toHaveBeenCalled();
  });

  it("supports multiple subscribers", () => {
    const store = createLocalStorageStore({
      key: "multi-key",
      eventName: "multi-event",
      defaultValue: "",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const unsub1 = store.subscribe(listener1);
    const unsub2 = store.subscribe(listener2);

    store.set("value");
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it("listens to cross-tab storage events", () => {
    const store = createLocalStorageStore({
      key: "cross-key",
      eventName: "cross-event",
      defaultValue: "",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    // Simulate a cross-tab storage event
    const storageEvent = new Event("storage");
    window.dispatchEvent(storageEvent);

    // The listener should have been called (cache invalidated)
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});

// ---------------------------------------------------------------------------
// isValid guard
// ---------------------------------------------------------------------------

describe("isValid guard", () => {
  it("returns default when isValid returns false", () => {
    localStorage.setItem("valid-key", JSON.stringify("corrupt"));
    const store = createLocalStorageStore({
      key: "valid-key",
      eventName: "valid-event",
      defaultValue: "clean",
      deserialize: (raw) => JSON.parse(raw) as string,
      isValid: (v) => v !== "corrupt",
    });
    expect(store.read()).toBe("clean");
  });

  it("returns stored value when isValid returns true", () => {
    localStorage.setItem("valid-key", JSON.stringify("good"));
    const store = createLocalStorageStore({
      key: "valid-key",
      eventName: "valid-event",
      defaultValue: "clean",
      deserialize: (raw) => JSON.parse(raw) as string,
      isValid: (v) => v === "good",
    });
    expect(store.read()).toBe("good");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("handles corrupted JSON in localStorage", () => {
    localStorage.setItem("corrupt-key", "{invalid json");
    const store = createLocalStorageStore({
      key: "corrupt-key",
      eventName: "corrupt-event",
      defaultValue: "safe",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    expect(store.read()).toBe("safe");
  });

  it("handles empty string in localStorage", () => {
    localStorage.setItem("empty-key", "");
    const store = createLocalStorageStore({
      key: "empty-key",
      eventName: "empty-event",
      defaultValue: "fallback",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    // Empty string is falsy, so it returns default
    expect(store.read()).toBe("fallback");
  });

  it("handles null from deserialize", () => {
    localStorage.setItem("null-key", "null");
    const store = createLocalStorageStore({
      key: "null-key",
      eventName: "null-event",
      defaultValue: "fallback",
      deserialize: (raw) => JSON.parse(raw) as string,
    });
    expect(store.read()).toBe("fallback");
  });

  it("handles undefined from deserialize", () => {
    localStorage.setItem("undef-key", "undefined");
    const store = createLocalStorageStore({
      key: "undef-key",
      eventName: "undef-event",
      defaultValue: "fallback",
      deserialize: () => undefined as unknown as string,
    });
    expect(store.read()).toBe("fallback");
  });

  it("set() with objects is referentially stable after read", () => {
    const store = createLocalStorageStore<Record<string, number>>({
      key: "ref-key",
      eventName: "ref-event",
      defaultValue: {},
      deserialize: (raw) => JSON.parse(raw) as Record<string, number>,
    });
    store.set({ a: 1 });
    const first = store.read();
    const second = store.read();
    expect(first).toBe(second); // same reference from cache
  });
});
