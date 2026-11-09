export type SupportedLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "go"
  | "rust"
  | "ruby"
  | "swift"
  | "kotlin"
  | "csharp"
  | "php"
  | "unknown";

export type LanguageStatus = "available" | "coming-soon";

export type LanguageInfo = {
  language: SupportedLanguage;
  label: string;
  isJavaScript: boolean;
  status: LanguageStatus;
  color: string;
};

const LANGUAGE_META: Record<SupportedLanguage, { label: string; color: string }> = {
  javascript: { label: "JavaScript", color: "bg-yellow-400/15 text-yellow-600 border-yellow-400/30" },
  typescript: { label: "TypeScript", color: "bg-blue-400/15 text-blue-600 border-blue-400/30" },
  python:     { label: "Python",     color: "bg-green-400/15 text-green-600 border-green-400/30" },
  java:       { label: "Java",       color: "bg-orange-400/15 text-orange-600 border-orange-400/30" },
  cpp:        { label: "C++",        color: "bg-purple-400/15 text-purple-600 border-purple-400/30" },
  go:         { label: "Go",         color: "bg-cyan-400/15 text-cyan-600 border-cyan-400/30" },
  rust:       { label: "Rust",       color: "bg-red-400/15 text-red-600 border-red-400/30" },
  ruby:       { label: "Ruby",       color: "bg-rose-400/15 text-rose-600 border-rose-400/30" },
  swift:      { label: "Swift",      color: "bg-orange-300/15 text-orange-500 border-orange-300/30" },
  kotlin:     { label: "Kotlin",     color: "bg-violet-400/15 text-violet-600 border-violet-400/30" },
  csharp:     { label: "C#",         color: "bg-indigo-400/15 text-indigo-600 border-indigo-400/30" },
  php:        { label: "PHP",        color: "bg-indigo-300/15 text-indigo-500 border-indigo-300/30" },
  unknown:    { label: "Unknown",    color: "bg-muted text-muted-foreground border-border" },
};

// JavaScript, TypeScript, and Python run natively (Python via Pyodide +
// sys.settrace). Java and C++ are traced through the AI translation path
// (OpenRouter → instrumented JS with //# line mapping back to the original
// source); the rest are on the roadmap and shown as disabled in the picker so
// users know they're coming.
export const AVAILABLE_LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

export const COMING_SOON_LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: "go",     label: "Go" },
  { value: "rust",   label: "Rust" },
  { value: "ruby",   label: "Ruby" },
  { value: "swift",  label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "csharp", label: "C#" },
  { value: "php",    label: "PHP" },
];

export const SUPPORTED_LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  ...AVAILABLE_LANGUAGE_OPTIONS,
  ...COMING_SOON_LANGUAGE_OPTIONS,
];

type DetectionRule = { language: SupportedLanguage; patterns: RegExp[] };

const RULES: DetectionRule[] = [
  {
    language: "python",
    patterns: [
      /^\s*def\s+\w+\s*\(/m,
      /^\s*import\s+\w+/m,
      /^\s*from\s+\w+\s+import/m,
      /^\s*class\s+\w+.*:/m,
      /print\s*\(/,
      /^\s*elif\s+/m,
      /:\s*$/m,
      /\bTrue\b|\bFalse\b|\bNone\b/,
      /\brange\s*\(/,
      /\blen\s*\(/,
    ],
  },
  {
    language: "java",
    patterns: [
      /public\s+class\s+\w+/,
      /public\s+static\s+void\s+main/,
      /System\.out\.print/,
      /import\s+java\./,
      /\bArrayList\b|\bHashMap\b|\bLinkedList\b/,
    ],
  },
  {
    // JavaScript signals. These help plain JS beat ambiguous matches from
    // other rule sets (e.g. `new Map()` previously matched the Java rule).
    language: "javascript",
    patterns: [
      /\b(?:const|let)\s+\w+/,
      /=>/,
      /`/,
      /\btypeof\b/,
      /\bundefined\b/,
      /\breturn\b/,
      /\bnew\s+(?:Map|Set|Array|Date|Promise|RegExp|WeakMap|WeakSet)\b/,
    ],
  },
  {
    language: "cpp",
    patterns: [
      /#include\s*[<"]/,
      /using\s+namespace\s+std/,
      /std::/,
      /cout\s*<</,
      /cin\s*>>/,
      /\bvector\s*</,
      /int\s+main\s*\(\s*\)/,
    ],
  },
  {
    language: "csharp",
    patterns: [
      /using\s+System;/,
      /Console\.Write/,
      /namespace\s+\w+/,
      /public\s+class\s+\w+\s*:/,
      /\bList<\w+>/,
      /\bDictionary<\w+,/,
    ],
  },
  {
    language: "go",
    patterns: [
      /^package\s+\w+/m,
      /^import\s+\(/m,
      /fmt\.Print/,
      /func\s+\w+\s*\([^)]*\)\s*[\w\[\]]*\s*\{/,
      /:=\s*/,
      /\bmake\s*\(/,
    ],
  },
  {
    language: "rust",
    patterns: [
      /fn\s+main\s*\(\s*\)/,
      /println!\s*\(/,
      /let\s+mut\s+/,
      /use\s+std::/,
      /Vec::/,
      /\bimpl\s+\w+/,
    ],
  },
  {
    language: "ruby",
    patterns: [
      /def\s+\w+\s*(\(|$)/m,
      /puts\s+/,
      /\.each\s+do\s*\|/,
      /end$/m,
      /require\s+['"]/,
      /\bnil\b|\btrue\b|\bfalse\b.*do\b/,
    ],
  },
  {
    language: "swift",
    patterns: [
      /var\s+\w+\s*:\s*\w+/,
      /let\s+\w+\s*:\s*\w+/,
      /print\s*\(/,
      /func\s+\w+\s*\(/,
      /import\s+Foundation/,
      /\bguard\b|\boptional\b/i,
    ],
  },
  {
    language: "kotlin",
    patterns: [
      /fun\s+main\s*\(/,
      /println\s*\(/,
      /val\s+\w+\s*=|var\s+\w+\s*=/,
      /fun\s+\w+\s*\([^)]*\)\s*:/,
      /\blistOf\b|\bmapOf\b|\barrayOf\b/,
    ],
  },
  {
    language: "php",
    patterns: [
      /<\?php/,
      /\$\w+\s*=/,
      /echo\s+/,
      /function\s+\w+\s*\(\s*\$\w*/,
      /\barray\s*\(/,
    ],
  },
  {
    language: "typescript",
    patterns: [
      /:\s*(string|number|boolean|void|any|never|unknown)\b/,
      /interface\s+\w+\s*\{/,
      /type\s+\w+\s*=/,
      /<\w+>/,
      /as\s+\w+/,
    ],
  },
];

export function detectLanguage(code: string): LanguageInfo {
  if (!code || code.trim().length === 0) {
    return buildInfo("javascript");
  }

  const scores: Partial<Record<SupportedLanguage, number>> = {};

  for (const rule of RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(code)) score++;
    }
    if (score > 0) {
      scores[rule.language] = score;
    }
  }

  if (Object.keys(scores).length === 0) {
    // Default to JavaScript if no patterns matched
    return buildInfo("javascript");
  }

  const maxScore = Math.max(...Object.values(scores));
  const topLanguages = (Object.keys(scores) as SupportedLanguage[]).filter(
    (language) => scores[language] === maxScore,
  );

  // On a tie, prefer JavaScript — except when TypeScript is in the mix.
  // Mis-detecting another language as JS fails with a clear error, whereas
  // mis-detecting JS as Python/Java/... sends the user's code through the slow
  // AI translation path for no reason. TypeScript is the safe exception: it is
  // still traced locally (isJavaScript), and the annotation stripper is a no-op
  // on plain JS, so choosing TS on a JS↔TS tie never sends JS down a translated
  // path.
  const chosen = topLanguages.includes("typescript")
    ? "typescript"
    : topLanguages.includes("javascript")
      ? "javascript"
      : topLanguages[0];
  return buildInfo(chosen as SupportedLanguage);
}

function buildInfo(language: SupportedLanguage): LanguageInfo {
  const meta = LANGUAGE_META[language] ?? LANGUAGE_META.unknown;
  const isJavaScript = language === "javascript" || language === "typescript";
  const runsViaTranslation = language === "java" || language === "cpp";
  return {
    language,
    label: meta.label,
    color: meta.color,
    isJavaScript,
    status: isJavaScript || language === "python" || runsViaTranslation ? "available" : "coming-soon",
  };
}

export function getLanguageInfo(language: SupportedLanguage): LanguageInfo {
  return buildInfo(language);
}
