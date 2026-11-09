"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, Copy, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sortingAlgorithms, type SortingAlgorithm } from "@/lib/sorting";
import {
  sortingAnswersFor,
  sortingLanguageTabs,
  type SortingLanguageId,
} from "@/lib/sorting-answers";

// ---------------------------------------------------------------------------
// Sorting Algorithms bank: one card per classic array-sorting algorithm. Each
// card describes the algorithm, shows its complexity table, deep-links into
// the visualizer (the same template id the tracer runs), and expands into the
// canonical implementation in every language the app provides.
// ---------------------------------------------------------------------------

const COMPLEXITY_ROWS: Array<{ key: "best" | "average" | "worst"; label: string }> = [
  { key: "best", label: "Best" },
  { key: "average", label: "Average" },
  { key: "worst", label: "Worst" },
];

export function SortingBank() {
  return (
    <div className="mt-8 space-y-4">
      {sortingAlgorithms.map((algorithm) => (
        <AlgorithmCard key={algorithm.id} algorithm={algorithm} />
      ))}
    </div>
  );
}

function AlgorithmCard({ algorithm }: { algorithm: SortingAlgorithm }) {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const answers = sortingAnswersFor(algorithm.id);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <CardTitle className="flex flex-wrap items-center gap-2">
            {algorithm.name}
            <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium">
              {algorithm.category}
            </Badge>
          </CardTitle>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{algorithm.description}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-7 shrink-0 gap-1 px-2.5 text-xs">
          <Link
            href={`/visualizer?t=${algorithm.id}`}
            title={`Trace ${algorithm.name} in the visualizer`}
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            Visualize
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {/* Complexity table */}
        <div className="flex flex-wrap items-center gap-2">
          {COMPLEXITY_ROWS.map(({ key, label }) => (
            <span
              key={key}
              className="rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground"
              title={`${label}-case time complexity`}
            >
              <span className="text-foreground/70">{label}</span>{" "}
              {algorithm.complexity[key]}
            </span>
          ))}
          <span
            className="rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground"
            title="Extra space complexity"
          >
            <span className="text-foreground/70">Space</span> {algorithm.complexity.space}
          </span>
        </div>

        {/* Solutions */}
        {answers ? (
          <div className="mt-4 border-t border-border/70 pt-4">
            <button
              type="button"
              onClick={() => setSolutionsOpen((open) => !open)}
              aria-expanded={solutionsOpen}
              aria-controls={`solutions-${algorithm.id}`}
              className="group flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${solutionsOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
              Solutions
              <span className="font-mono text-[10px] text-muted-foreground/70">
                JS · TS · Python · Java · C++
              </span>
            </button>
            {solutionsOpen ? (
              <div id={`solutions-${algorithm.id}`} className="mt-3">
                <LanguageTabs algorithmId={algorithm.id} />
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LanguageTabs({ algorithmId }: { algorithmId: string }) {
  const answers = sortingAnswersFor(algorithmId);
  const [copied, setCopied] = useState<SortingLanguageId | null>(null);

  if (!answers) return null;

  const copy = async (language: SortingLanguageId) => {
    try {
      await navigator.clipboard.writeText(answers.answers[language]);
      setCopied(language);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable — the code is still visible to copy manually.
    }
  };

  return (
    <Tabs defaultValue={sortingLanguageTabs[0].id}>
      <TabsList className="h-8 flex-wrap">
        {sortingLanguageTabs.map((language) => (
          <TabsTrigger
            key={language.id}
            value={language.id}
            className="h-7 px-2.5 text-xs"
          >
            {language.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {sortingLanguageTabs.map((language) => (
        <TabsContent key={language.id} value={language.id}>
          <div className="overflow-hidden rounded-md border bg-muted/30">
            <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">
                {language.label}
              </span>
              <button
                type="button"
                onClick={() => void copy(language.id)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Copy ${language.label} solution`}
              >
                {copied === language.id ? (
                  <>
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" aria-hidden="true" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-80 overflow-auto p-4 font-mono text-xs leading-6 text-foreground/90">
              {answers.answers[language.id]}
            </pre>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
