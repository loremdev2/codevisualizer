#!/usr/bin/env node
// Codegen: Generates TypeScript template files from JSON data.
//
// Usage: node scripts/codegen-templates.mjs
//
// Reads JSON from templates/ and writes TypeScript to src/lib/.
// The generated files are structurally equivalent to the original hand-written ones.

import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEMPLATES_DIR = path.join(ROOT, "templates");

/**
 * Escape a string for use inside a backtick template literal.
 *
 * JSON stores the *runtime* value of each code string. When we embed that
 * value inside a template literal we must re-escape characters that have
 * special meaning in that context:
 *   - backslash  → \\
 *   - backtick   → \`
 *   - ${         → \${
 */
function escapeTemplate(str) {
  return str
    .replace(/\\/g, "\\\\")   // backslash  → double backslash
    .replace(/`/g, "\\`")     // backtick   → escaped backtick
    .replace(/\$\{/g, "\\${"); // ${         → escaped interpolation
}

// ---------------------------------------------------------------------------
// Multilang codegen
// ---------------------------------------------------------------------------

function codegenMultilang(jsonFile, tsFile, typeName, varName, docComment) {
  const data = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, jsonFile), "utf8"));
  const numbers = Object.keys(data).map(Number).sort((a, b) => a - b);

  const langs = ["pythonCode", "typescriptCode", "javaCode", "cppCode",
                  "brutePythonCode", "bruteTypeScriptCode", "bruteJavaCode", "bruteCppCode"];

  let output = docComment + "\n\n";
  output += `export type ${typeName} = {\n`;
  for (const lang of langs) {
    output += `  ${lang}?: string;\n`;
  }
  output += `};\n\n`;
  output += `export const ${varName}: Partial<Record<number, ${typeName}>> = {\n`;

  for (const no of numbers) {
    const entry = data[no];
    output += `  ${no}: {\n`;
    for (const lang of langs) {
      if (entry[lang]) {
        output += `${lang}: \`${escapeTemplate(entry[lang])}\`,\n`;
      }
    }
    output += `},\n`;
  }

  output += `};\n`;
  fs.writeFileSync(path.join(ROOT, tsFile), output);
  console.log(`${tsFile}: ${numbers.length} entries, ${output.split("\n").length} lines`);
}

// ---------------------------------------------------------------------------
// Templates codegen (JS code + input + expected)
// ---------------------------------------------------------------------------

function codegenTemplates(jsonFile, tsFile, typeName, varName, extraFields, docComment) {
  const data = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, jsonFile), "utf8"));
  const numbers = Object.keys(data).map(Number).sort((a, b) => a - b);

  let output = docComment + "\n\n";
  output += `export type ${typeName} = {\n`;
  output += `  /** LeetCode problem number. */\n`;
  output += `  no: number;\n`;
  output += `  /** Canonical JS solution in LeetCode format (class Solution). */\n`;
  output += `  code: string;\n`;
  output += `  /** The problem's example input, matching the method's parameter names. */\n`;
  output += `  input: Record<string, unknown>;\n`;
  output += `  /** Expected result (worker-serialized: lists → arrays, trees → level-order). */\n`;
  output += `  expected?: unknown;\n`;
  if (extraFields) {
    for (const field of extraFields) {
      output += `  ${field};\n`;
    }
  }
  output += `};\n\n`;
  output += `export const ${varName}: Record<number, ${typeName}> = {\n`;

  for (const no of numbers) {
    const entry = data[no];
    output += `  ${no}: {\n`;
    output += `    no: ${no},\n`;
    output += `    code: \`${escapeTemplate(entry.code)}\`,\n`;
    output += `    input: ${JSON.stringify(entry.input)},\n`;
    if (entry.expected !== undefined) {
      output += `    expected: ${JSON.stringify(entry.expected)},\n`;
    }
    if (entry.bruteCode) {
      output += `    bruteCode: \`${escapeTemplate(entry.bruteCode)}\`,\n`;
    }
    output += `  },\n`;
  }

  output += `};\n`;
  fs.writeFileSync(path.join(ROOT, tsFile), output);
  console.log(`${tsFile}: ${numbers.length} entries, ${output.split("\n").length} lines`);
}

// ---------------------------------------------------------------------------
// Generate all files
// ---------------------------------------------------------------------------

console.log("=== Generating TypeScript from JSON ===\n");

codegenMultilang(
  "top150-multilang.json",
  "src/lib/top150-multilang.ts",
  "Top150MultiLang",
  "top150MultiLang",
  `// ---------------------------------------------------------------------------
// Multi-language variants (Python, TypeScript, Java, C++) for the Top Interview 150 templates.
//
// AUTO-GENERATED from templates/top150-multilang.json — do not edit by hand.
// Each entry mirrors the JS solution in top150-templates.ts (same class
// Solution + method + parameter names, so the auto-detected harness maps
// the input identically). All solutions are verified in top150-templates.test.ts.
// ---------------------------------------------------------------------------`
);

codegenMultilang(
  "neetcode-multilang.json",
  "src/lib/neetcode-multilang.ts",
  "NeetCodeMultiLang",
  "neetcodeMultiLang",
  `// ---------------------------------------------------------------------------
// Multi-language variants (Python, TypeScript, Java, C++) for the NeetCode Roadmap templates.
//
// AUTO-GENERATED from templates/neetcode-multilang.json — do not edit by hand.
// Each entry mirrors the JS solution in neetcode-templates.ts (same class
// Solution + method + parameter names, so the auto-detected harness maps
// the input identically). All solutions are verified in neetcode-templates.test.ts.
// ---------------------------------------------------------------------------`
);

codegenTemplates(
  "top150-templates.json",
  "src/lib/top150-templates-data.ts",
  "Top150TemplateData",
  "top150TemplateData",
  ["bruteCode?: string"],
  `// ---------------------------------------------------------------------------
// Template data (JS code + input + expected) for Top Interview 150.
//
// AUTO-GENERATED from templates/top150-templates.json — do not edit by hand.
// ---------------------------------------------------------------------------`
);

codegenTemplates(
  "neetcode-templates.json",
  "src/lib/neetcode-templates-data.ts",
  "NeetCodeTemplateData",
  "neetcodeTemplateData",
  ["bruteCode?: string"],
  `// ---------------------------------------------------------------------------
// Template data (JS code + input + expected) for NeetCode Roadmap.
//
// AUTO-GENERATED from templates/neetcode-templates.json — do not edit by hand.
// ---------------------------------------------------------------------------`
);

console.log("\n=== Codegen complete ===");
