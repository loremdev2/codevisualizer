"use client";

import { useMemo, useState } from "react";
import { Braces, ListPlus, Minus, Plus, Settings2, Wand2, X } from "lucide-react";

import {
  detectStringAlphabet,
  generateArray,
  generateGraph,
  generateMatrix,
  generateString,
  STRING_ALPHABETS,
  type StringAlphabet,
} from "@/lib/input-generators";

/**
 * Structured input editor.
 *
 * The tracer still receives the exact same JSON string (`inputText`) — this is
 * purely a friendlier way to edit it. Each top-level field gets an editor
 * inferred from its value's shape (array → cells, matrix → grid, graph →
 * node/neighbor rows, number → steppers, string → text), and every edit is
 * serialized back to JSON so nothing downstream changes.
 */

export type InputExample = {
  label: string;
  input: Record<string, unknown>;
  expected?: unknown;
};

type InputEditorProps = {
  value: string;
  onChange: (json: string) => void;
  examples?: InputExample[];
};

type FieldKind = "array" | "matrix" | "graph" | "dict" | "number" | "string" | "boolean" | "other";

function inferKind(value: unknown): FieldKind {
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((item) => Array.isArray(item))) return "matrix";
    return "array";
  }
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "boolean";
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.values(value as Record<string, unknown>);
    return entries.length > 0 && entries.every((item) => Array.isArray(item)) ? "graph" : "dict";
  }
  return "other";
}

const KIND_LABEL: Record<FieldKind, string> = {
  array: "array",
  matrix: "matrix",
  graph: "graph",
  dict: "map",
  number: "number",
  string: "string",
  boolean: "bool",
  other: "any",
};

/** Parse a cell's text into a number when possible, else keep it a string. */
function coercePrimitive(text: string): unknown {
  if (text.trim() === "") return "";
  const number = Number(text);
  return Number.isFinite(number) ? number : text;
}

function formatCell(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return String(value);
  return String(value);
}

function typeButtonClass(active: boolean) {
  return `inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors ${
    active
      ? "border border-primary/40 bg-primary/10 text-foreground"
      : "border border-transparent text-muted-foreground hover:text-foreground"
  }`;
}

export function StructuredInputEditor({ value, onChange, examples }: InputEditorProps) {
  const [mode, setMode] = useState<"form" | "json">("form");
  const [addingField, setAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldKind, setNewFieldKind] = useState<"number" | "string" | "array" | "matrix" | "graph">(
    "number",
  );

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, data: JSON.parse(value) as unknown };
    } catch {
      return { ok: false as const };
    }
  }, [value]);

  const [form, setForm] = useState<unknown>(() => (parsed.ok ? parsed.data : null));
  // Re-sync the form whenever the JSON changes externally (template load, Try
  // variants). Self-produced edits echo back the same string, so resetting to
  // the parsed data is a harmless no-op that stops after one render.
  const [lastPushed, setLastPushed] = useState(value);

  if (value !== lastPushed && parsed.ok) {
    setLastPushed(value);
    setForm(parsed.data);
  }

  const commit = (next: unknown) => {
    setForm(next);
    try {
      const json = JSON.stringify(next, null, 2);
      setLastPushed(json);
      onChange(json);
    } catch {
      // Non-serializable — leave the raw JSON untouched.
    }
  };

  const updateField = (key: string, fieldValue: unknown) => {
    if (!form || typeof form !== "object" || Array.isArray(form)) return;
    commit({ ...(form as Record<string, unknown>), [key]: fieldValue });
  };

  const addField = () => {
    const name = newFieldName.trim();
    if (!name) return;
    const defaults: Record<string, unknown> = {
      number: 0,
      string: "",
      array: [0],
      matrix: [[0]],
      graph: { A: [] },
    };
    updateField(name, defaults[newFieldKind]);
    setNewFieldName("");
    setAddingField(false);
  };

  const parseFailed = !parsed.ok;
  const hasExamples = examples && examples.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Examples dropdown + Form / JSON toggle */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border/50 px-3 py-1.5">
        {hasExamples ? (
          <select
            value=""
            onChange={(event) => {
              const idx = Number(event.target.value);
              if (idx >= 0 && idx < examples!.length) {
                onChange(JSON.stringify(examples![idx].input, null, 2));
              }
              // Reset to placeholder after selection
              event.currentTarget.value = "";
            }}
            className="h-6 rounded-md border border-border bg-background px-1.5 text-[11px] font-medium text-muted-foreground outline-none hover:text-foreground"
          >
            <option value="" disabled>
              Examples
            </option>
            {examples!.map((ex, i) => (
              <option key={i} value={i}>
                {ex.label}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          className={typeButtonClass(mode === "form" && !parseFailed)}
          disabled={parseFailed}
          onClick={() => setMode("form")}
        >
          <Settings2 className="h-3 w-3" aria-hidden="true" />
          Form
        </button>
        <button type="button" className={typeButtonClass(mode === "json")} onClick={() => setMode("json")}>
          <Braces className="h-3 w-3" aria-hidden="true" />
          JSON
        </button>
        {parseFailed ? (
          <span className="ml-2 text-[11px] text-destructive">Fix the JSON below to use the form.</span>
        ) : null}
      </div>

      {mode === "json" || parseFailed ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          aria-label="Input JSON"
          className="h-full w-full resize-none bg-transparent p-3 font-mono text-[13px] leading-5 outline-none"
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          {Array.isArray(form) ? (
            <div className="px-3 py-2">
              <FieldRow name="input" value={form} onChange={(next) => commit(next)} />
            </div>
          ) : form && typeof form === "object" ? (
            <div className="px-3 py-2">
              {Object.entries(form as Record<string, unknown>).map(([key, fieldValue]) => (
                <FieldRow key={key} name={key} value={fieldValue} onChange={(next) => updateField(key, next)} />
              ))}
              {addingField ? (
                <div className="mt-2 flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/20 p-1.5">
                  <input
                    autoFocus
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addField();
                      if (e.key === "Escape") setAddingField(false);
                    }}
                    placeholder="field name"
                    className="w-28 rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] outline-none"
                  />
                  <select
                    value={newFieldKind}
                    onChange={(e) => setNewFieldKind(e.target.value as typeof newFieldKind)}
                    className="rounded-md border border-border bg-background px-1 py-1 text-[11px] outline-none"
                  >
                    <option value="number">number</option>
                    <option value="string">string</option>
                    <option value="array">array</option>
                    <option value="matrix">matrix</option>
                    <option value="graph">graph</option>
                  </select>
                  <button
                    type="button"
                    onClick={addField}
                    className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingField(false)}
                    className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingField(true)}
                  className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ListPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add field
                </button>
              )}
            </div>
          ) : (
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              spellCheck={false}
              aria-label="Input JSON"
              className="h-full w-full resize-none bg-transparent p-3 font-mono text-[13px] leading-5 outline-none"
            />
          )}
        </div>
      )}
    </div>
  );
}

function FieldRow({
  name,
  value,
  onChange,
}: {
  name: string;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const kind = inferKind(value);
  const canGenerate = kind === "array" || kind === "matrix" || kind === "graph" || kind === "string";
  const [showGenerator, setShowGenerator] = useState(false);
  return (
    <div className="border-b border-border/50 py-1.5 last:border-b-0">
      <div className="mb-1 flex items-center gap-2">
        <span className="max-w-[40%] truncate font-mono text-[11px] font-medium text-foreground/85">{name}</span>
        <span className="rounded bg-muted px-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          {KIND_LABEL[kind]}
        </span>
        {canGenerate ? (
          <button
            type="button"
            onClick={() => setShowGenerator((current) => !current)}
            className={`ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              showGenerator
                ? "border border-primary/40 bg-primary/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Generate values"
          >
            <Wand2 className="h-3 w-3" aria-hidden="true" />
            Generate
          </button>
        ) : null}
      </div>
      <div className="pl-0.5">
        <FieldEditor kind={kind} value={value} onChange={onChange} />
        {showGenerator && canGenerate ? (
          <GeneratorPanel kind={kind} value={value} onChange={onChange} />
        ) : null}
      </div>
    </div>
  );
}

function GeneratorPanel({
  kind,
  value,
  onChange,
}: {
  kind: FieldKind;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  switch (kind) {
    case "array":
      return <ArrayGenerator value={value as unknown[]} onChange={onChange} />;
    case "matrix":
      return <MatrixGenerator value={value as unknown[][]} onChange={onChange} />;
    case "graph":
      return <GraphGenerator value={value as Record<string, unknown[]>} onChange={onChange} />;
    case "string":
      return <StringGenerator value={value as string} onChange={onChange} />;
    default:
      return null;
  }
}

function ArrayGenerator({ value, onChange }: { value: unknown[]; onChange: (next: unknown[]) => void }) {
  const numeric = value.length > 0 && value.every((item) => typeof item === "number");
  const [size, setSize] = useState(Math.min(12, Math.max(1, value.length)));
  const [maxVal, setMaxVal] = useState(20);
  const [distinct, setDistinct] = useState(false);
  if (!numeric) return null;
  const generate = () => {
    onChange(generateArray({ size, maxVal, distinct }));
  };
  return (
    <div className="mt-1.5 rounded-md border border-border/70 bg-muted/20 p-2">
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="w-16 shrink-0">Size · {size}</span>
          <input
            type="range"
            min={1}
            max={20}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="w-24 shrink-0">Values 0–{maxVal}</span>
          <input
            type="range"
            min={5}
            max={99}
            value={maxVal}
            onChange={(event) => setMaxVal(Number(event.target.value))}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <input
            type="checkbox"
            checked={distinct}
            onChange={(event) => setDistinct(event.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          Distinct values
        </label>
        <button
          type="button"
          onClick={generate}
          className="ml-auto rounded-md bg-primary px-2.5 py-0.5 text-[10.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function MatrixGenerator({ value, onChange }: { value: unknown[][]; onChange: (next: unknown[][]) => void }) {
  const numeric = value.length > 0 && value.every((row) => row.every((cell) => typeof cell === "number"));
  const [rows, setRows] = useState(Math.min(5, Math.max(1, value.length)));
  const [cols, setCols] = useState(Math.min(5, Math.max(1, value[0]?.length ?? 1)));
  const [maxVal, setMaxVal] = useState(9);
  if (!numeric) return null;
  const generate = () => {
    onChange(generateMatrix({ rows, cols, maxVal }));
  };
  return (
    <div className="mt-1.5 rounded-md border border-border/70 bg-muted/20 p-2">
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="w-20 shrink-0">Rows · {rows}</span>
          <input
            type="range"
            min={1}
            max={8}
            value={rows}
            onChange={(event) => setRows(Number(event.target.value))}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="w-20 shrink-0">Cols · {cols}</span>
          <input
            type="range"
            min={1}
            max={8}
            value={cols}
            onChange={(event) => setCols(Number(event.target.value))}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="w-24 shrink-0">Values 0–{maxVal}</span>
          <input
            type="range"
            min={0}
            max={20}
            value={maxVal}
            onChange={(event) => setMaxVal(Number(event.target.value))}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
      </div>
      <div className="mt-1.5 flex items-center">
        <button
          type="button"
          onClick={generate}
          className="ml-auto rounded-md bg-primary px-2.5 py-0.5 text-[10.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function GraphGenerator({
  value,
  onChange,
}: {
  value: Record<string, unknown[]>;
  onChange: (next: Record<string, unknown[]>) => void;
}) {
  const [nodes, setNodes] = useState(Math.min(6, Math.max(2, Object.keys(value).length)));
  const [density, setDensity] = useState(40);
  const generate = () => {
    onChange(generateGraph({ nodes, density }));
  };
  return (
    <div className="mt-1.5 rounded-md border border-border/70 bg-muted/20 p-2">
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="w-20 shrink-0">Nodes · {nodes}</span>
          <input
            type="range"
            min={2}
            max={8}
            value={nodes}
            onChange={(event) => setNodes(Number(event.target.value))}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="w-28 shrink-0">Edge density · {density}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={density}
            onChange={(event) => setDensity(Number(event.target.value))}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
      </div>
      <div className="mt-1.5 flex items-center">
        <button
          type="button"
          onClick={generate}
          className="ml-auto rounded-md bg-primary px-2.5 py-0.5 text-[10.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

const STRING_ALPHABET_OPTIONS: { value: StringAlphabet; label: string }[] = [
  { value: "upper", label: "A–Z" },
  { value: "binary", label: "A/B" },
  { value: "lower", label: "a–z" },
  { value: "digits", label: "0–9" },
];

function StringGenerator({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [length, setLength] = useState(Math.min(12, Math.max(1, value.length || 6)));
  const [alphabet, setAlphabet] = useState<StringAlphabet>(() => detectStringAlphabet(value));
  const generate = () => {
    onChange(generateString(length, alphabet));
  };
  return (
    <div className="mt-1.5 rounded-md border border-border/70 bg-muted/20 p-2">
      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="w-16 shrink-0">Length · {length}</span>
          <input
            type="range"
            min={1}
            max={30}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
            className="min-w-0 flex-1 accent-primary"
          />
        </label>
        <label className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <span className="shrink-0">Chars</span>
          <select
            value={alphabet}
            onChange={(event) => setAlphabet(event.target.value as StringAlphabet)}
            className="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10.5px] outline-none"
          >
            {STRING_ALPHABET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <span className="truncate font-mono text-[10.5px] text-muted-foreground/70">
          e.g. {generateString(8, alphabet)}
        </span>
        <button
          type="button"
          onClick={generate}
          className="ml-auto shrink-0 rounded-md bg-primary px-2.5 py-0.5 text-[10.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function FieldEditor({ kind, value, onChange }: { kind: FieldKind; value: unknown; onChange: (next: unknown) => void }) {
  switch (kind) {
    case "array":
      return <ArrayCellsEditor value={value as unknown[]} onChange={onChange} />;
    case "matrix":
      return <GridEditor value={value as unknown[][]} onChange={onChange} />;
    case "graph":
      return <GraphEditor value={value as Record<string, unknown[]>} onChange={onChange} />;
    case "dict":
      return <DictEditor value={value as Record<string, unknown>} onChange={onChange} />;
    case "number":
      return <NumberField value={value as number} onChange={onChange} />;
    case "string":
      return <StringField value={value as string} onChange={onChange} />;
    case "boolean":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
      );
    default:
      return <StringField value={String(value)} onChange={onChange} />;
  }
}

function ArrayCellsEditor({ value, onChange }: { value: unknown[]; onChange: (next: unknown[]) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {value.map((item, index) => (
        <span key={index} className="flex items-center overflow-hidden rounded-md border border-border bg-background">
          <input
            type="text"
            value={formatCell(item)}
            onChange={(event) => {
              const next = [...value];
              next[index] = coercePrimitive(event.target.value);
              onChange(next);
            }}
            className="w-12 bg-transparent px-1 py-1 text-center font-mono text-[12px] outline-none"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            className="px-1 text-muted-foreground/50 transition-colors hover:text-destructive"
            aria-label="Remove item"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, value.length > 0 && typeof value[0] === "number" ? 0 : ""])}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        aria-label="Add item"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function NumberField({ value, onChange }: { value: number; onChange: (next: unknown) => void }) {
  const current = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={String(value)}
        onChange={(event) => onChange(coercePrimitive(event.target.value))}
        className="w-20 rounded-md border border-border bg-background px-2 py-1 text-center font-mono text-[12px] outline-none focus:border-primary/50"
      />
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        aria-label="Increment"
      >
        <Plus className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        aria-label="Decrement"
      >
        <Minus className="h-3 w-3" />
      </button>
    </div>
  );
}

function StringField({ value, onChange }: { value: string; onChange: (next: unknown) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full max-w-xs rounded-md border border-border bg-background px-2 py-1 font-mono text-[12px] outline-none focus:border-primary/50"
    />
  );
}

function GridEditor({ value, onChange }: { value: unknown[][]; onChange: (next: unknown[][]) => void }) {
  const updateCell = (row: number, col: number, text: string) => {
    const next = value.map((r) => [...r]);
    next[row][col] = coercePrimitive(text);
    onChange(next);
  };
  return (
    <div className="space-y-1">
      {value.map((row, r) => (
        <div key={r} className="flex items-center gap-1">
          {row.map((cell, c) => (
            <input
              key={c}
              type="text"
              value={formatCell(cell)}
              onChange={(e) => updateCell(r, c, e.target.value)}
              className="h-7 w-10 rounded-md border border-border bg-background text-center font-mono text-[12px] outline-none focus:border-primary/50"
            />
          ))}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== r))}
            className="ml-0.5 rounded p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
            aria-label="Remove row"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() =>
            onChange([...value.map((row) => [...row, row.length > 0 && typeof row[0] === "number" ? 0 : ""]), []])
          }
          className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> row
        </button>
        <button
          type="button"
          onClick={() => onChange(value.map((row) => [...row, row.length > 0 && typeof row[0] === "number" ? 0 : ""]))}
          className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> col
        </button>
        <button
          type="button"
          onClick={() => onChange(value.map((row) => row.slice(0, -1)).filter((row) => row.length > 0))}
          className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Minus className="h-3 w-3" /> col
        </button>
      </div>
    </div>
  );
}

function GraphEditor({ value, onChange }: { value: Record<string, unknown[]>; onChange: (next: Record<string, unknown[]>) => void }) {
  const renameNode = (oldName: string, newName: string) => {
    const next: Record<string, unknown[]> = {};
    for (const [node, neighbors] of Object.entries(value)) {
      next[node === oldName ? newName : node] = neighbors;
    }
    onChange(next);
  };
  const updateNeighbors = (node: string, text: string) => {
    const neighbors = text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    onChange({ ...value, [node]: neighbors });
  };
  return (
    <div className="space-y-1">
      {Object.entries(value).map(([node, neighbors]) => (
        <div key={node} className="flex items-center gap-1.5">
          <input
            type="text"
            value={node}
            onChange={(e) => renameNode(node, e.target.value)}
            className="w-12 rounded-md border border-border bg-background px-1.5 py-1 text-center font-mono text-[12px] outline-none focus:border-primary/50"
          />
          <span className="text-muted-foreground/60">→</span>
          <input
            type="text"
            value={(neighbors as unknown[]).join(", ")}
            onChange={(e) => updateNeighbors(node, e.target.value)}
            placeholder="B, C"
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-[12px] outline-none focus:border-primary/50"
          />
          <button
            type="button"
            onClick={() => {
              const next = { ...value };
              delete next[node];
              onChange(next);
            }}
            className="rounded p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
            aria-label="Remove node"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          let name = "Z";
          const taken = new Set(Object.keys(value));
          while (taken.has(name)) name = name + name[name.length - 1].toLowerCase();
          onChange({ ...value, [name]: [] });
        }}
        className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
      >
        <Plus className="h-3 w-3" /> node
      </button>
    </div>
  );
}

function DictEditor({ value, onChange }: { value: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-1">
      {Object.entries(value).map(([key, item]) => (
        <div key={key} className="flex items-center gap-1.5">
          <input
            type="text"
            value={key}
            onChange={(e) => {
              const next: Record<string, unknown> = {};
              for (const [k, v] of Object.entries(value)) next[k === key ? e.target.value : k] = v;
              onChange(next);
            }}
            className="w-20 rounded-md border border-border bg-background px-2 py-1 font-mono text-[12px] outline-none focus:border-primary/50"
          />
          <span className="text-muted-foreground/60">:</span>
          <input
            type="text"
            value={formatCell(item)}
            onChange={(e) => onChange({ ...value, [key]: coercePrimitive(e.target.value) })}
            className="w-24 rounded-md border border-border bg-background px-2 py-1 font-mono text-[12px] outline-none focus:border-primary/50"
          />
          <button
            type="button"
            onClick={() => {
              const next = { ...value };
              delete next[key];
              onChange(next);
            }}
            className="rounded p-1 text-muted-foreground/50 transition-colors hover:text-destructive"
            aria-label="Remove entry"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...value, key: 0 })}
        className="flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
      >
        <Plus className="h-3 w-3" /> entry
      </button>
    </div>
  );
}
