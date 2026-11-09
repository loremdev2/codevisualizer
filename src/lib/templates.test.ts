import { describe, expect, it } from "vitest";

import { algorithmTemplates } from "./templates";
import { runTraceInNode } from "./trace-runner";

type Shape =
  | { kind: "any" }
  | { kind: "primitive"; type: string }
  | { kind: "array"; items: Shape }
  | { kind: "object"; valueShapes: Shape[] };

const ANY: Shape = { kind: "any" };

/** Structural fingerprint: primitives by typeof, arrays by first item, objects by value shapes. */
function shapeOf(value: unknown): Shape {
  if (value === null) return { kind: "primitive", type: "null" };
  if (Array.isArray(value)) {
    return { kind: "array", items: value.length ? shapeOf(value[0]) : ANY };
  }
  if (typeof value === "object") {
    return {
      kind: "object",
      valueShapes: Object.values(value as Record<string, unknown>).map(shapeOf),
    };
  }
  return { kind: "primitive", type: typeof value };
}

function shapesCompatible(a: Shape, b: Shape): boolean {
  if (a.kind === "any" || b.kind === "any") return true;
  // null is the universal "empty reference" sentinel (e.g. a linked-list tail
  // or an empty list head) — compatible with any shape.
  if (
    (a.kind === "primitive" && a.type === "null") ||
    (b.kind === "primitive" && b.type === "null")
  ) {
    return true;
  }
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case "primitive":
      return a.type === (b as Extract<Shape, { kind: "primitive" }>).type;
    case "array":
      return shapesCompatible(a.items, (b as Extract<Shape, { kind: "array" }>).items);
    case "object": {
      // Graphs/dicts legitimately vary their key counts (node counts, map
      // entries), so every value shape on one side just needs a compatible
      // partner on the other.
      const aObject = a as Extract<Shape, { kind: "object" }>;
      const bObject = b as Extract<Shape, { kind: "object" }>;
      const coveredBy = (needle: Shape, haystack: Shape[]) =>
        haystack.some((other) => shapesCompatible(needle, other));
      return (
        aObject.valueShapes.every((shape) => coveredBy(shape, bObject.valueShapes)) &&
        bObject.valueShapes.every((shape) => coveredBy(shape, aObject.valueShapes))
      );
    }
  }
}

describe("example library", () => {
  it("every template ships at least two canonical examples", () => {
    for (const template of algorithmTemplates) {
      expect(template.examples?.length ?? 0, template.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("example labels are unique within each template", () => {
    for (const template of algorithmTemplates) {
      const labels = (template.examples ?? []).map((example) => example.label);
      expect(new Set(labels).size, `${template.id} labels`).toBe(labels.length);
    }
  });

  it("every example covers exactly the template's input keys", () => {
    for (const template of algorithmTemplates) {
      const defaultKeys = Object.keys(template.input).sort();
      for (const example of template.examples ?? []) {
        const exampleKeys = Object.keys(example.input).sort();
        expect(exampleKeys, `${template.id} · ${example.label}`).toEqual(defaultKeys);
      }
    }
  });

  it("every example value is structurally compatible with the template's default input", () => {
    for (const template of algorithmTemplates) {
      const defaultShape = shapeOf(template.input);
      for (const example of template.examples ?? []) {
        expect(
          shapesCompatible(shapeOf(example.input), defaultShape),
          `${template.id} · ${example.label}`,
        ).toBe(true);
      }
    }
  });

  it("examples survive a JSON round-trip (no undefined/functions/NaN)", () => {
    for (const template of algorithmTemplates) {
      for (const example of template.examples ?? []) {
        expect(JSON.parse(JSON.stringify(example.input)), `${template.id} · ${example.label}`).toEqual(
          example.input,
        );
      }
    }
  });
});

describe("example library runs", () => {
  const jsTemplates = algorithmTemplates.filter(
    (template) => !template.language || template.language === "javascript",
  );

  for (const template of jsTemplates) {
    for (const example of template.examples ?? []) {
      it(`${template.id} · ${example.label}: traces successfully and matches its expected result`, async () => {
        const message = await runTraceInNode(template.code, JSON.stringify(example.input));
        expect(message.ok, `${template.id} · ${example.label}: ${message.error ?? ""}`).toBe(true);
        expect(message.steps?.length ?? 0).toBeGreaterThan(0);
        expect(message.result, `${template.id} · ${example.label}`).toEqual(example.expected);
      });
    }
  }
});

describe("every traceable template carries a verified expected result", () => {
  it("every JavaScript template (default input + every example) has a known answer", () => {
    for (const template of algorithmTemplates) {
      if (template.language && template.language !== "javascript") continue;
      expect(template.expected, `${template.id} default`).toBeDefined();
      for (const example of template.examples ?? []) {
        expect(example.expected, `${template.id} · ${example.label}`).toBeDefined();
      }
    }
  });

  it("the default input's trace matches the template-level expected", async () => {
    const failures: string[] = [];
    for (const template of algorithmTemplates) {
      if (template.language && template.language !== "javascript") continue;
      const message = await runTraceInNode(template.code, JSON.stringify(template.input));
      if (!message.ok) {
        failures.push(`${template.id}: trace failed — ${message.error ?? ""}`);
        continue;
      }
      if (JSON.stringify(message.result) !== JSON.stringify(template.expected)) {
        failures.push(
          `${template.id}: got ${JSON.stringify(message.result)}, expected ${JSON.stringify(template.expected)}`,
        );
      }
    }
    expect(failures).toEqual([]);
  });
});
