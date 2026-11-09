import { describe, expect, it } from "vitest";

import { buildPythonSteps, type PythonRawEvent } from "./python-steps";
import { normalizeSteps } from "@/lib/trace/normalize";
import { runTraceInNode, type WorkerTraceMessage } from "@/lib/trace-runner";

// ---------------------------------------------------------------------------
// JS trace helper (runs real code through the same worker the browser uses)
// ---------------------------------------------------------------------------
async function traceJS(code: string): Promise<ReturnType<typeof normalizeSteps>> {
  const message: WorkerTraceMessage = await runTraceInNode(code, "{}");
  expect(message.ok, message.error ?? "JS trace failed").toBe(true);
  return normalizeSteps(message.steps ?? []);
}

// ---------------------------------------------------------------------------
// Python trace helper (builds raw events as the Pyodide harness would produce)
// ---------------------------------------------------------------------------
function tracePython(locals: Record<string, unknown>, previous?: Record<string, unknown>): ReturnType<typeof buildPythonSteps> {
  const rawEvents: PythonRawEvent[] = [
    { kind: "line", line: 1, locals: previous ?? locals, note: "setup" },
    { kind: "line", line: 2, locals, note: "step" },
  ];
  return buildPythonSteps(rawEvents);
}

// ---------------------------------------------------------------------------
// Parity: stack alongside a generic numeric array
// ---------------------------------------------------------------------------
describe("stack + generic array parity", () => {
  it("JS: stack-named array captures as stack panel even with nums present", async () => {
    const steps = await traceJS(`
      const stack = [];
      stack.push(1);
      stack.push(2);
      const nums = [3, 4];
      return stack;
    `);
    const stackStep = steps.find((s) => s.stack);
    expect(stackStep).toBeDefined();
    expect(stackStep?.stackName).toBe("stack");
    // nums should also be captured
    expect(steps.some((s) => s.arrayName === "nums")).toBe(true);
  });

  it("Python: stack-named entry should capture as stack even when numericArrayEntry exists", () => {
    // Simulate locals where both "stack" (numeric) and "nums" (numeric) exist.
    // pickCollectionSlots will find numericArrayEntry = "nums", so
    // the for-loop guard (!numericArrayEntry) prevents stack capture.
    // STACK_EXACT_RE should bypass this, matching the JS worker behavior.
    const locals = { stack: [1, 2], nums: [3, 4] };
    const { steps } = tracePython(locals);
    const last = steps[steps.length - 1];
    // The stack should be captured as a stack panel
    expect(last.stack).toEqual([1, 2]);
    expect(last.stackName).toBe("stack");
    // nums should also be captured as the generic array
    expect(last.arrayName).toBe("nums");
    expect(last.array).toEqual([3, 4]);
  });

  it("Python: queue alongside nums renders both panels (regression check)", () => {
    const locals = { queue: [10, 20], nums: [1, 2] };
    const { steps } = tracePython(locals);
    const last = steps[steps.length - 1];
    expect(last.queue).toEqual([10, 20]);
    expect(last.queueName).toBe("queue");
    expect(last.arrayName).toBe("nums");
    expect(last.array).toEqual([1, 2]);
  });

  it("Python: heap alongside nums renders both panels (regression check)", () => {
    const locals = { heap: [1, 3, 2], nums: [5, 6] };
    const { steps } = tracePython(locals);
    const last = steps[steps.length - 1];
    expect(last.heap?.items).toEqual([1, 3, 2]);
    expect(last.heap?.name).toBe("heap");
    expect(last.arrayName).toBe("nums");
    expect(last.array).toEqual([5, 6]);
  });
});
