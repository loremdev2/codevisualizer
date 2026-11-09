import { createPythonWorkerSource } from "./python-worker-source";

export type PythonTraceOutcome = {
  ok: boolean;
  /** Raw trace events — feed into buildPythonSteps. */
  steps: Array<Record<string, unknown>>;
  error?: string;
  truncated?: boolean;
};

export type PythonRunOptions = {
  /** Called with worker status messages ("loading-pyodide", ...). */
  onStatus?: (message: string) => void;
  timeoutMs?: number;
  /**
   * LeetCode/GFG entry harness (from buildPythonHarness), compiled under a
   * `<harness>` filename the tracer ignores and executed after the student
   * code. Empty for template-style code.
   */
  entryCode?: string;
};

// The Pyodide runtime (~15 MB WASM) is expensive to load, so the worker is
// created once and reused for every Python run. It is only torn down on a hang
// (timeout) or via terminatePythonWorker (used on unmount).
let worker: Worker | null = null;
let workerUrl: string | null = null;
let readyPromise: Promise<Worker> | null = null;
let requestId = 0;

function createWorker(): Worker {
  const url = URL.createObjectURL(
    new Blob([createPythonWorkerSource()], { type: "application/javascript" }),
  );
  const instance = new Worker(url);
  workerUrl = url;
  return instance;
}

/**
 * Resolves with a ready worker (Pyodide loaded). On failure, resets the
 * singleton so a later run can retry, and rejects with a friendly error.
 */
function getReadyWorker(timeoutMs: number): Promise<Worker> {
  if (worker) return Promise.resolve(worker);
  if (readyPromise) return readyPromise;

  readyPromise = new Promise<Worker>((resolve, reject) => {
    const instance = createWorker();
    const timer = setTimeout(() => {
      instance.terminate();
      worker = null;
      readyPromise = null;
      reject(new Error("The Python runtime took too long to load. Check your connection and try again."));
    }, timeoutMs);

    instance.onmessage = (event) => {
      if (event.data?.type === "ready") {
        clearTimeout(timer);
        resolve(instance);
      } else if (event.data?.type === "status") {
        // Surface load progress to the UI.
      }
    };
    instance.onerror = (event) => {
      clearTimeout(timer);
      instance.terminate();
      worker = null;
      readyPromise = null;
      const detail = event && event.message ? String(event.message) : "";
      reject(
        new Error(
          detail
            ? "The Python runtime crashed while loading: " + detail
            : "The Python runtime crashed while loading. Try again.",
        ),
      );
    };

    instance.postMessage({ type: "init" });
  });

  return readyPromise;
}

/** Terminates the persistent worker (unmount, or after a hung run). */
export function terminatePythonWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  if (workerUrl) {
    URL.revokeObjectURL(workerUrl);
    workerUrl = null;
  }
  readyPromise = null;
}

/**
 * Traces Python code with Pyodide + sys.settrace. Returns raw trace events;
 * the caller converts them with buildPythonSteps and normalizes. The worker is
 * persistent, so the first call downloads/loads the WASM runtime (~15 MB) and
 * every later call is fast.
 */
export async function runPythonTrace(
  code: string,
  inputText: string,
  options: PythonRunOptions = {},
): Promise<PythonTraceOutcome> {
  const timeoutMs = options.timeoutMs ?? 60_000;

  let runtime: Worker;
  try {
    runtime = await getReadyWorker(Math.min(timeoutMs, 120_000));
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }

  const id = ++requestId;

  return new Promise<PythonTraceOutcome>((resolve) => {
    const timer = setTimeout(() => {
      runtime.removeEventListener("message", onMessage);
      // The worker hung (infinite loop with no state change) — kill it so the
      // next run starts fresh.
      terminatePythonWorker();
      resolve({
        ok: false,
        steps: [],
        error:
          "The Python code ran for too long and was stopped. Check for an infinite loop, or try a smaller input.",
      });
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      const message = event.data;
      if (message?.type === "status") {
        options.onStatus?.(String(message.message));
        return;
      }
      if (message?.type === "result" && message.id === id) {
        clearTimeout(timer);
        runtime.removeEventListener("message", onMessage);
        resolve({
          ok: Boolean(message.ok),
          steps: Array.isArray(message.steps) ? message.steps : [],
          error: message.error ? String(message.error) : undefined,
          truncated: Boolean(message.truncated),
        });
      }
    }

    runtime.addEventListener("message", onMessage);
    runtime.postMessage({ type: "run", id, code, inputText, entryCode: options.entryCode ?? "" });
  });
}
