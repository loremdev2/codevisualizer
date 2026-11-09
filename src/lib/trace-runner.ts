/**
 * Trace pipeline barrel.
 *
 * The tracing system lives in `src/lib/trace/`, split by responsibility:
 *
 * - `instrumenter`   — rewrites user code (AST) so state changes are captured
 * - `worker-source`  — the sandboxed Web Worker runtime that runs instrumented
 *                      code and emits steps
 * - `normalize`      — whitelists/coerces worker steps and derives matrix
 *                      phase notes
 * - `ast`            — the custom AST walker with lexical scoping
 * - `typescript`     — TS annotation stripping + `//# line` mapping
 *
 * This file keeps the public API stable and hosts `runTraceInNode`, the Node
 * harness used by tests (it runs the worker source against a fake `self`).
 */

import { instrument, type InstrumentOptions } from "./trace/instrumenter";
import { annotateMatrixPhases, normalizeSteps } from "./trace/normalize";
import { buildJsHarness, detectJsEntry } from "./trace/leetcode";
import { stripTypeScript } from "./trace/typescript";
import { createWorkerSource, type TraceRunOptions, type WorkerTraceMessage } from "./trace/worker-source";

export { instrument, annotateMatrixPhases, normalizeSteps, createWorkerSource };
export type { InstrumentOptions, InstrumentResult } from "./trace/instrumenter";
export type { TraceRunOptions, WorkerTraceMessage } from "./trace/worker-source";

/**
 * Instruments user code and, when it reads as a pasted LeetCode/GFG solution
 * (class Solution / bare function that never references `input`), appends the
 * auto-detected entry harness. The harness maps the input JSON onto the
 * entry's parameters, converts LeetCode-style array inputs into ListNode /
 * TreeNode chains, invokes the entry, and returns the result.
 */
export function instrumentForTrace(source: string, options: InstrumentOptions = {}): ReturnType<typeof instrument> {
  const result = instrument(source, options);
  const inputText = options.inputText ?? "{}";
  // TypeScript annotations would break the entry detector's parser, so run it
  // against the type-stripped source (mirrors what instrument() traced).
  const entry = detectJsEntry(options.typescript ? stripTypeScript(source) : source, inputText);
  if (entry) {
    result.code = result.code + buildJsHarness(entry, source, inputText);
  }
  return result;
}

/**
 * True when the worker hit the step limit (not a parse/runtime error). The JS
 * worker keeps up to 3000 partial steps alongside this error so the UI can show
 * the friendly truncation notice and still let the user step through the trace
 * — mirroring the Python runner's `truncated` flag.
 */
export function isStepLimitError(error: string | null | undefined): boolean {
  return error?.includes("Step limit reached") ?? false;
}

/** Run an instrumented trace under Node, polyfilling `self` so the worker source runs unchanged. */
export async function runTraceInNode(
  code: string,
  inputText: string,
  options: TraceRunOptions = {},
): Promise<WorkerTraceMessage> {
  const instrumented = instrumentForTrace(code, {
    typescript: options.typescript,
    inputText,
  });
  const messages: WorkerTraceMessage[] = [];

  const fakeSelf = {
    fetch: () => Promise.reject(new Error("Network calls are disabled in the trace runner.")),
    XMLHttpRequest: undefined,
    WebSocket: undefined,
    importScripts: () => {
      throw new Error("External scripts are disabled in the trace runner.");
    },
    postMessage: (message: WorkerTraceMessage) => {
      messages.push(message);
    },
    onmessage: null as null | ((event: { data: { code: string; inputText: string } }) => Promise<void>),
  };

  const factory = new Function("self", createWorkerSource());
  factory(fakeSelf);

  if (!fakeSelf.onmessage) {
    throw new Error("The trace runner did not install a message handler.");
  }

  const timeoutMs = options.timeoutMs ?? 15_000;
  await Promise.race([
    fakeSelf.onmessage({ data: { code: instrumented.code, inputText } }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Trace timed out after ${timeoutMs}ms.`)), timeoutMs);
    }),
  ]);

  const last = messages[messages.length - 1];
  if (!last) return { ok: false, error: "The trace runner produced no response." };
  return last;
}
