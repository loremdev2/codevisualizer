// ---------------------------------------------------------------------------
// TypeScript tolerance + line mapping
//
// - `stripTypeScript` removes type annotations so TS code can be parsed as JS
//   (the tracer instruments a JS AST, not a TS one).
// - `parseLineDirectives` reads `//# line: N` directives that AI translations
//   emit, so trace steps point back at the user's original lines.
// ---------------------------------------------------------------------------

export function parseLineDirectives(code: string): Map<number, number> {
  const map = new Map<number, number>();
  let currentOriginal = 0;
  const lines = code.split("\n");

  for (let index = 0; index < lines.length; index++) {
    const match = /^\s*\/\/#\s*line:\s*(\d+)\s*$/.exec(lines[index]);
    if (match) {
      currentOriginal = Number(match[1]);
    } else if (currentOriginal > 0 && lines[index].trim()) {
      map.set(index + 1, currentOriginal);
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// TypeScript stripping — a pragmatic pass for LeetCode-style annotations.
// Anything it can't handle falls back to the Gemini translation path.
// ---------------------------------------------------------------------------

export function stripTypeScript(code: string): string {
  const lines = code.split("\n");
  const output: string[] = [];
  let skipping = false;
  let skippingDepth = 0;

  for (const rawLine of lines) {
    if (skipping) {
      skippingDepth += braceDelta(rawLine);
      if (skippingDepth <= 0) {
        skipping = false;
        skippingDepth = 0;
      }
      continue;
    }

    const line = rawLine.trim();
    if (/^(?:export\s+|declare\s+)?(?:interface|type|enum|namespace|abstract\s+class)\b/.test(line)) {
      const depth = braceDelta(rawLine);
      if (depth > 0) {
        skipping = true;
        skippingDepth = depth;
      }
      continue;
    }

    output.push(stripAnnotationsOnLine(rawLine));
  }

  const stripped = output.join("\n");
  return stripAsAssertions(stripNewMapArgs(stripped))
    // Non-null assertions: `foo!` → `foo`
    .replace(/\b([A-Za-z_$][\w$]*)\s*!\s*(?=[.\[(,;)\s+\-*/%<>&|?]|$)/g, "$1")
    // Non-null assertions after closing paren: `.pop()!.` → `.pop().`
    .replace(/\)\!(?=[.,;)\s]|$)/g, ")");
}

/**
 * Strip `as` type assertions with balanced bracket handling.
 * e.g. `foo as [number,string][]` → `foo`
 */
function stripAsAssertions(code: string): string {
  let result = code;
  while (true) {
    const match = /\s+as\s+/.exec(result);
    if (!match) break;
    const typeStart = match.index + match[0].length;
    let i = typeStart;
    let depth = 0;
    while (i < result.length) {
      const ch = result[i];
      if (ch === "<" || ch === "(" || ch === "{" || ch === "[") depth++;
      else if (ch === ">" || ch === ")" || ch === "}" || ch === "]") {
        if (depth > 0) depth--;
        else break;
      } else if (depth === 0 && (ch === ";" || ch === "," || ch === ")" || ch === "{" || ch === "}" || ch === "\n" || /\s/.test(ch))) break;
      i++;
    }
    result = result.slice(0, match.index) + result.slice(i);
  }
  return result;
}

/** Strip `new Map<number, number>()` → `new Map()` */
function stripNewMapArgs(code: string): string {
  return code.replace(/\bnew\s+([A-Za-z_$][\w$]*)\s*<((?:[^<>]|<[^<>]*>)*)>/g, "new $1");
}

function braceDelta(line: string): number {
  let delta = 0;
  for (const char of line) {
    if (char === "{") delta++;
    else if (char === "}") delta--;
  }
  return delta;
}

const TYPE_STOP = new Set(["=", ";", ",", ")", "{", "}"]);

/**
 * Scan a type annotation starting after the `:`. Returns the index just past
 * the type, or -1 if no type was found. Brackets (`<>`, `()`, `{}`) are
 * consumed as a unit so generics like `Map<string, number>` survive.
 */
function scanTypeEnd(text: string, start: number): number {
  let i = start;
  let sawTypeChar = false;
  const length = text.length;

  while (i < length) {
    const char = text[i];
    if (char === "\n") break;
    if (TYPE_STOP.has(char)) break;

    if (char === "<" || char === "(" || char === "{" || char === "[") {
      const open = char;
      const close = open === "<" ? ">" : open === "(" ? ")" : open === "{" ? "}" : "]";
      let depth = 0;
      while (i < length) {
        const inner = text[i];
        if (inner === open) depth++;
        else if (inner === close) {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        } else if (inner === "\n") {
          break;
        }
        i++;
      }
      sawTypeChar = true;
      continue;
    }

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[A-Za-z_$\d]/.test(char) || char === "." || char === "[" || char === "]" || char === "|" || char === "&" || char === "?") {
      sawTypeChar = true;
      i++;
      continue;
    }

    break;
  }

  let end = sawTypeChar ? i : -1;
  if (end !== -1) {
    // Don't consume whitespace that belongs to the surrounding expression.
    while (end > start && /\s/.test(text[end - 1])) end--;
  }
  return end;
}

function stripAnnotationsOnLine(line: string): string {
  // Strip access modifiers from class fields and methods without const/let/var.
  // e.g. "  private count = 0;" → "  count = 0;"
  // e.g. "  private walk(...) { }" → "  walk(...) { }"
  let tempResult = line;
  let changed = true;
  while (changed) {
    changed = false;
    const before = tempResult;
    tempResult = tempResult.replace(
      /^((?:\s|\t)*)(?:(?:private|public|protected|readonly|static|override|abstract)\s+)+(?!(?:const|let|var)\b)([A-Za-z_$][\w$]*)/,
      "$1$2"
    );
    if (tempResult !== before) changed = true;
  }

  // Strip class field type annotations: "result: number | null = null" → "result = null"
  // Matches lines like `  name: Type = value` or `  name: Type;` (no const/let/var prefix)
  {
    const m = /^([ \t]*)([A-Za-z_$][\w$]*)(\s*:\s*)/.exec(tempResult);
    if (m) {
      const afterColon = m.index + m[0].length;
      const end = scanTypeEnd(tempResult, afterColon);
      if (end !== -1) {
        tempResult = tempResult.slice(0, m.index + m[1].length + m[2].length) + tempResult.slice(end);
      }
    }
  }

  let result = stripVariableAnnotations(tempResult);
  result = stripParamAnnotations(result);

  // Function/arrow return types: `): Type {` or `): Type =>`
  result = result.replace(/\)\s*:\s*([A-Za-z_$][\w$<>\[\].,|&?\s]*?)\s*(?=\{\s*$|=>)/g, ") ");
  return result;
}

function stripVariableAnnotations(line: string): string {
  const regex = /\b(?:private|public|protected|readonly|static|override|abstract)+\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)(\s*:\s*)/g;
  const regex2 = /\b(const|let|var)\s+([A-Za-z_$][\w$]*)(\s*:\s*)/g;
  const edits: Array<[number, number]> = [];
  let match: RegExpExecArray | null;

  const processMatch = (match: RegExpExecArray, nameGroupIdx: number, colonGroupIdx: number) => {
    const colonGroup = match[colonGroupIdx];
    const typeStart = match.index + match[0].length - colonGroup.length + colonGroup.indexOf(":") + 1;
    const end = scanTypeEnd(line, typeStart);
    if (end === -1) return;
    // Remove from access modifier (if any) through the type annotation
    const kwMatch = /^(?:private|public|protected|readonly|static|override|abstract|\s)+/.exec(match[0]);
    const editStart = kwMatch ? match.index + kwMatch[0].length - kwMatch[0].trimStart().length : match.index + match[0].length - colonGroup.length;
    edits.push([match.index + match[0].length - colonGroup.length, end]);
  };
  while ((match = regex.exec(line))) {
    processMatch(match, 1, 2);
  }
  while ((match = regex2.exec(line))) {
    processMatch(match, 2, 3);
  }

  // Also handle comma-separated declarations: let a: T = x, b: T = y
  // Skip matches inside braces/brackets (object literals, arrays, generics).
  const commaRegex = /,\s*([A-Za-z_$][\w$]*)(\s*:\s*)/g;
  let commaMatch: RegExpExecArray | null;
  while ((commaMatch = commaRegex.exec(line))) {
    // Skip if inside braces (object literals) or angle brackets (generics).
    let braceDepth = 0;
    for (let ci = 0; ci < commaMatch.index; ci++) {
      if (line[ci] === "{" || line[ci] === "(" || line[ci] === "<" || line[ci] === "[") braceDepth++;
      else if (line[ci] === "}" || line[ci] === ")" || line[ci] === ">" || line[ci] === "]") braceDepth--;
    }
    if (braceDepth !== 0) continue;
    const colonGroup = commaMatch[2];
    const typeStart = commaMatch.index + commaMatch[0].length - colonGroup.length + colonGroup.indexOf(":") + 1;
    const end = scanTypeEnd(line, typeStart);
    if (end === -1) continue;
    edits.push([commaMatch.index + commaMatch[0].length - colonGroup.length, end]);
  }

  return applyEdits(line, edits);
}

function stripParamAnnotations(line: string): string {
  const edits: Array<[number, number]> = [];
  const length = line.length;
  let i = 0;
  let parenDepth = 0;
  let braceDepth = 0;

  while (i < length) {
    const char = line[i];
    if (char === "(") parenDepth++;
    else if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (char === "{") braceDepth++;
    else if (char === "}") braceDepth = Math.max(0, braceDepth - 1);

    if (/[A-Za-z_$]/.test(char) && parenDepth > 0 && braceDepth === 0) {
      const nameMatch = /^([A-Za-z_$][\w$]*)\s*\??\s*:\s*/.exec(line.slice(i));
      if (nameMatch) {
        let prev = i - 1;
        while (prev >= 0 && /\s/.test(line[prev])) prev--;
        const before = prev >= 0 ? line[prev] : "";

        if (before === "(" || before === ",") {
          const afterColon = i + nameMatch[0].length;
          const firstNonSpace = /^\s*(\S)/.exec(line.slice(afterColon))?.[1];
          const looksLikeValue = firstNonSpace === undefined || /[0-9'"`{[\-+]/.test(firstNonSpace);
          if (!looksLikeValue) {
            const end = scanTypeEnd(line, afterColon);
            if (end !== -1) {
              // Remove the annotation but keep the parameter name (and any `?`).
              const optionalIndex = nameMatch[0].indexOf("?");
              const colonIndex = nameMatch[0].indexOf(":");
              const editStart = i + (optionalIndex >= 0 ? optionalIndex : colonIndex);
              edits.push([editStart, end]);
              i = end;
              continue;
            }
          }
        }
      }
    }
    i++;
  }

  return applyEdits(line, edits);
}

function applyEdits(line: string, edits: Array<[number, number]>): string {
  let result = line;
  for (const [start, end] of [...edits].sort((a, b) => b[0] - a[0])) {
    result = result.slice(0, start) + result.slice(end);
  }
  return result;
}
