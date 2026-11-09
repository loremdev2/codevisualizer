/**
 * Python trace worker source.
 *
 * Unlike the JS instrumenter, Python can't be rewritten with acorn — but it
 * ships its own tracer: `sys.settrace` fires on every line of the student's
 * code with the real frame's locals and line numbers. The worker loads Pyodide
 * (the CPython WASM build) once, runs a small harness that installs the tracer,
 * and posts raw events back to the main thread, where `buildPythonSteps`
 * converts them into the shared VisualStep schema.
 *
 * The worker source is a string (Blob-constructed Worker), so the Python
 * harness is embedded as a JSON string and executed via `runPython`.
 */

export const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v314.0.4/full/pyodide.js";

/**
 * The Python harness. Reads `__student_code` and `__input_json` from the
 * Pyodide globals, installs a line tracer filtered to the student's module
 * (`<student>`), and appends one raw event per line / call / return / print.
 * The event list is serialized to `__steps_json` for a clean JS round-trip.
 */
export const PYTHON_HARNESS = `
import sys, json, linecache, traceback
from collections import deque

__input_data = json.loads(__input_json)
__max_events = 3000
__steps = []
__call_stack = []
__comparisons = 0
__truncated = False
__error = None

def to_jsonable(value, depth=0):
    if depth > 8:
        return "<...>"
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (list, tuple, deque)):
        return [to_jsonable(v, depth + 1) for v in value]
    if isinstance(value, set):
        return [to_jsonable(v, depth + 1) for v in sorted(value, key=lambda x: (type(x).__name__, str(x)))]
    if isinstance(value, dict):
        return {str(k): to_jsonable(v, depth + 1) for k, v in value.items()}
    return "<" + type(value).__name__ + ">"

def fmt_value(value, depth=0):
    if value is None: return "None"
    if isinstance(value, bool): return "True" if value else "False"
    if isinstance(value, (int, float)): return str(value)
    if isinstance(value, str):
        return repr(value) if len(value) <= 40 else repr(value[:37]) + "..."
    if isinstance(value, (list, tuple, deque)):
        inner = ", ".join(fmt_value(v, depth + 1) for v in list(value)[:6])
        return "[" + inner + ("..." if len(value) > 6 else "") + "]"
    if isinstance(value, dict):
        inner = ", ".join(str(k) + ": " + fmt_value(v, depth + 1) for k, v in list(value.items())[:4])
        return "{" + inner + ("..." if len(value) > 4 else "") + "}"
    if isinstance(value, set):
        return "{" + ", ".join(fmt_value(v, depth + 1) for v in list(value)[:4]) + "}"
    return "<" + type(value).__name__ + ">"

def fmt_frame(frame):
    name = frame.f_code.co_name
    args = []
    for k, v in frame.f_locals.items():
        if k.startswith("__"):
            continue
        args.append(k + "=" + fmt_value(v))
    return name + "(" + ", ".join(args) + ")"

def node_kind(value):
    if hasattr(value, "val") and hasattr(value, "next"):
        return "list"
    if hasattr(value, "val") and (hasattr(value, "left") or hasattr(value, "right")):
        return "tree"
    return None

# Merge the module globals (graph, visited, input, ...) with the current
# frame's locals so recursion steps show the whole visible state. Node-typed
# values (ListNode / TreeNode) are serialized into a shared id map so the
# Variables panel can render them as real chains — id assignment uses object
# identity, so a 'root' variable and a 'node' pointer into the same tree
# share ids and cycles are handled without infinite recursion.
def snapshot(frame):
    names = {}
    names.update(frame.f_globals)
    names.update(frame.f_locals)
    locals_json = {}
    nodes = {"values": {}, "next": {}, "left": {}, "right": {}, "prev": {}, "refs": {}}
    node_ids = {}
    def node_id(obj):
        key = id(obj)
        if key not in node_ids:
            node_ids[key] = len(node_ids)
        return node_ids[key]
    def walk(obj, kind):
        if obj is None:
            return None
        nid = node_id(obj)
        key = str(nid)
        if key in nodes["values"]:
            return nid
        nodes["values"][key] = obj.val
        if kind == "list":
            child = getattr(obj, "next", None)
            nodes["next"][key] = walk(child, "list") if child is not None else None
            if hasattr(obj, "prev"):
                prev = getattr(obj, "prev", None)
                nodes["prev"][key] = node_id(prev) if prev is not None else None
        else:
            left = getattr(obj, "left", None)
            right = getattr(obj, "right", None)
            nodes["left"][key] = walk(left, "tree") if left is not None else None
            nodes["right"][key] = walk(right, "tree") if right is not None else None
        return nid
    for name, value in names.items():
        if name.startswith("__"):
            continue
        kind = node_kind(value)
        if kind is not None:
            nodes["refs"][name] = {"id": walk(value, kind), "kind": kind}
        else:
            locals_json[name] = to_jsonable(value)
    return {"locals": locals_json, "nodes": nodes}

# Sets are serialized to arrays by to_jsonable, losing their identity — carry
# them separately (name -> items) so the Variables panel can render them as
# Sets instead of unnamed arrays.
def collect_sets(frame):
    names = {}
    names.update(frame.f_globals)
    names.update(frame.f_locals)
    return {
        k: [to_jsonable(v) for v in value]
        for k, value in names.items()
        if isinstance(value, (set, frozenset)) and not k.startswith("__")
    }

def emit(frame, kind, note):
    snap = snapshot(frame)
    __steps.append({
        "line": frame.f_lineno,
        "locals": snap["locals"],
        "nodes": snap["nodes"],
        "sets": collect_sets(frame),
        "callstack": list(__call_stack),
        "kind": kind,
        "note": note,
        "comparisons": __comparisons,
    })

def tracer(frame, event, arg):
    global __comparisons, __truncated
    if frame.f_code.co_filename != "<student>":
        return None
    if event == "line":
        if len(__steps) >= __max_events:
            __truncated = True
            # Returning None would only stop tracing — the code would keep
            # running forever. Raise so exec() unwinds and the run ends now.
            raise RuntimeError("trace-step-limit")
        src = linecache.getline("<student>", frame.f_lineno).strip()
        if src.startswith("if ") or src.startswith("elif ") or src.startswith("while "):
            if any(op in src for op in ("<", ">", "==", "!=", "<=", ">=")):
                __comparisons += 1
            emit(frame, "branch", src)
        else:
            # Carry the source line as the note so line steps show the actual
            # statement in the header (mirroring the JS instrumenter's labels)
            # instead of a generic "running" placeholder.
            emit(frame, "line", src)
    elif event == "call":
        if len(__steps) >= __max_events:
            __truncated = True
            return None
        name = frame.f_code.co_name
        if not name.startswith("<") and name != "<module>":
            label = fmt_frame(frame)
            __call_stack.append(label)
            emit(frame, "call", label)
        return tracer
    elif event == "return":
        name = frame.f_code.co_name
        if not name.startswith("<") and name != "<module>" and __call_stack:
            label = __call_stack.pop()
            note = "Return from " + label
            try:
                note = note + " → " + fmt_value(arg)
            except Exception:
                pass
            emit(frame, "return", note)
        return tracer
    return tracer

def emit_console_line(line):
    # Module-level function: __-prefixed names inside a class are mangled to
    # class-private names (e.g. _StdoutCapture__steps), so console output must
    # be appended here instead of in StdoutCapture.
    __steps.append({
        "line": None,
        "locals": {},
        "callstack": list(__call_stack),
        "kind": "console",
        "note": line,
        "comparisons": __comparisons,
    })

class StdoutCapture:
    def __init__(self):
        self.buffer = ""
    def write(self, text):
        self.buffer += text
        while "\\n" in self.buffer:
            line, self.buffer = self.buffer.split("\\n", 1)
            emit_console_line(line)
        return len(text)
    def flush(self):
        pass

# Register the student source so linecache.getline can read branch lines.
__lines = __student_code.splitlines(True)
linecache.cache["<student>"] = (len(__lines), None, __lines, "<student>")

_old_stdout = sys.stdout
sys.stdout = StdoutCapture()

try:
    __code = compile(__student_code, "<student>", "exec")
    __ns = {"input": __input_data, "__student_code": __student_code}
    sys.settrace(tracer)
    exec(__code, __ns)
    # LeetCode/GFG entry harness (class Solution / bare function): compiled
    # under a <harness> filename the tracer ignores, so the wrapper's own
    # lines never appear in the trace — only the student method bodies do.
    __entry_code = globals().get("__entry_code") or ""
    if __entry_code:
        exec(compile(__entry_code, "<harness>", "exec"), __ns)
except RuntimeError as exc:
    # The tracer's step-limit raise — not a student error. Keep the partial
    # steps and mark the run truncated instead of reporting a failure.
    if str(exc) != "trace-step-limit":
        __error = str(exc)
except Exception as exc:
    try:
        tb = traceback.extract_tb(exc.__traceback__)
        for frame in tb:
            if frame.filename == "<student>":
                __error = "Line " + str(frame.lineno) + ": " + str(exc)
                break
        else:
            __error = str(exc)
    except Exception:
        __error = str(exc)
finally:
    sys.settrace(None)
    sys.stdout = _old_stdout

__steps_json = json.dumps(__steps)
`;

/**
 * Creates the worker source. The worker is a pure runtime: it disables
 * networking (only the pinned Pyodide CDN may be imported) and answers
 * `init` / `run` messages, posting raw trace events for the main thread.
 */
export function createPythonWorkerSource() {
  return `
"use strict";

const PYODIDE_CDN = ${JSON.stringify(PYODIDE_CDN)};

// Networking is disabled except for the pinned Pyodide CDN — Pyodide itself
// fetches its WASM and stdlib zip from there, so both fetch and importScripts
// are allowed only for that prefix.
const PYODIDE_ORIGIN = "https://cdn.jsdelivr.net/pyodide/";
const PYODIDE_DIR = PYODIDE_CDN.replace(/pyodide\.js$/, "");
const ORIGINAL_FETCH = self.fetch.bind(self);
self.fetch = (input, init) => {
  // Pyodide passes strings, Request objects, AND URL objects (browser_getBinaryResponse
  // wraps the url in new URL(url, location) before fetching) — normalize all of them.
  let url = "";
  if (typeof input === "string") url = input;
  else if (input instanceof URL) url = input.href;
  else if (input instanceof Request) url = input.url;
  else if (input && typeof input.url === "string") url = input.url;
  else if (input && typeof input.href === "string") url = input.href;
  // Blob workers can't resolve relative paths against the CDN, and Pyodide
  // resolves them against the worker's blob location instead. Map any non-http
  // URL (relative path or blob:) onto the pinned CDN directory.
  if (url && !/^https?:/i.test(url)) {
    const path = url.startsWith("blob:") ? url.split("/").pop() : url;
    return ORIGINAL_FETCH(new URL(path, PYODIDE_DIR).href, init);
  }
  if (!url.startsWith(PYODIDE_ORIGIN)) {
    return Promise.reject(new Error("Network calls are disabled in the Python trace runner (" + url + ")."));
  }
  return ORIGINAL_FETCH(input, init);
};
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
const importPyodide = self.importScripts.bind(self);
self.importScripts = (...urls) => {
  for (const url of urls) {
    if (typeof url !== "string" || !url.startsWith(PYODIDE_ORIGIN)) {
      throw new Error("External scripts are disabled in the Python trace runner.");
    }
  }
  return importPyodide(...urls);
};

// Surface uncaught worker errors (including during importScripts / loadPyodide)
// so the main thread can show the real reason instead of a generic crash.
self.addEventListener("error", (event) => {
  self.postMessage({
    type: "worker-error",
    error: (event && event.message) || "Uncaught worker error",
    filename: event && event.filename,
    lineno: event && event.lineno,
  });
});
self.addEventListener("unhandledrejection", (event) => {
  const reason = event && event.reason;
  self.postMessage({
    type: "worker-error",
    error: reason && reason.message ? String(reason.message) : String(reason),
  });
});

const HARNESS = ${JSON.stringify(PYTHON_HARNESS)};

let pyodide = null;

async function ensurePyodide() {
  if (pyodide) return pyodide;
  self.postMessage({ type: "status", message: "loading-pyodide" });
  importPyodide(PYODIDE_CDN);
  // In a Blob worker self.location is the blob URL, so Pyodide can't infer its
  // CDN directory — pass it explicitly or its wasm/stdlib fetches go nowhere.
  const indexURL = PYODIDE_CDN.replace(/pyodide\.js$/, "");
  pyodide = await self.loadPyodide({ indexURL });
  return pyodide;
}

self.onmessage = async (event) => {
  const data = event.data || {};
  try {
    if (data.type === "init") {
      await ensurePyodide();
      self.postMessage({ type: "ready" });
      return;
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error && error.message ? String(error.message) : String(error),
    });
    return;
  }
  try {
    if (data.type === "run") {
      const runtime = await ensurePyodide();
      runtime.globals.set("__student_code", data.code);
      runtime.globals.set("__input_json", data.inputText);
      runtime.globals.set("__entry_code", data.entryCode || "");
      runtime.runPython(HARNESS);
      const rawStepsJson = runtime.globals.get("__steps_json");
      const steps = typeof rawStepsJson === "string" ? JSON.parse(rawStepsJson) : [];
      const truncated = Boolean(runtime.globals.get("__truncated"));
      const error = runtime.globals.get("__error");
      self.postMessage({
        type: "result",
        id: data.id,
        ok: !error,
        steps,
        result: undefined,
        truncated,
        error: error ? String(error) : undefined,
      });
      return;
    }
  } catch (error) {
    self.postMessage({
      type: "result",
      id: data.id,
      ok: false,
      steps: [],
      result: undefined,
      truncated: false,
      error: error && error.message ? String(error.message) : String(error),
    });
  }
};
`;
}
