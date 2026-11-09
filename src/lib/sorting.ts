// ---------------------------------------------------------------------------
// Sorting Algorithms bank.
//
// A curated set of the classic array-sorting algorithms, each with a
// traceable visualizer template (see src/lib/templates.ts — ids are
// deep-linkable via /visualizer?t=<id>) and answers in every language the
// app provides (see src/lib/sorting-answers.ts). This module stays light:
// no solution code, just the algorithm metadata the /learn page renders.
// ---------------------------------------------------------------------------

export type SortingComplexity = {
  best: string;
  average: string;
  worst: string;
  space: string;
};

export type SortingAlgorithm = {
  /** Template id in src/lib/templates.ts (also the deep-link id). */
  id: string;
  name: string;
  category: string;
  description: string;
  complexity: SortingComplexity;
};

export const sortingAlgorithms: SortingAlgorithm[] = [
  {
    id: "bubble-sort",
    name: "Bubble sort",
    category: "Comparison",
    description:
      "Repeatedly swaps adjacent out-of-order pairs; the largest unsorted value bubbles to the end on every pass. The simplest sort to read, but quadratic on everything.",
    complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  },
  {
    id: "selection-sort",
    name: "Selection sort",
    category: "Comparison",
    description:
      "Each pass finds the smallest remaining element and swaps it into place — exactly one swap per pass, but the scan is always quadratic.",
    complexity: { best: "O(n²)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  },
  {
    id: "insertion-sort",
    name: "Insertion sort",
    category: "Comparison",
    description:
      "Builds the sorted prefix one element at a time, sliding each new key left to its correct spot. Nearly-linear on almost-sorted input and the sort of choice for tiny arrays.",
    complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)" },
  },
  {
    id: "merge-sort",
    name: "Merge sort",
    category: "Divide & conquer",
    description:
      "Splits the array in half, sorts each half recursively, then merges the two sorted halves. Stable and guaranteed O(n log n) — watch the recursive call stack in the trace.",
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  },
  {
    id: "quick-sort",
    name: "Quick sort",
    category: "Divide & conquer",
    description:
      "Partitions the range around a pivot — smaller values left, larger right — then recurses on both sides. Usually the fastest comparison sort in practice.",
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
  },
  {
    id: "heap-sort",
    name: "Heap sort",
    category: "Selection",
    description:
      "Builds a max-heap, then repeatedly swaps the largest remaining value to the end and re-heapifies. In-place O(n log n) with no extra memory.",
    complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
  },
  {
    id: "counting-sort",
    name: "Counting sort",
    category: "Non-comparison",
    description:
      "Counts how often each value appears, then writes values back in order. Linear O(n + k), but only for small-range non-negative integers.",
    complexity: { best: "O(n + k)", average: "O(n + k)", worst: "O(n + k)", space: "O(k)" },
  },
];

/** Look an algorithm up by its template id. */
export function sortingAlgoByTemplateId(id: string): SortingAlgorithm | undefined {
  return sortingAlgorithms.find((algorithm) => algorithm.id === id);
}

/**
 * Guards against transcription drift: every algorithm needs a name, category,
 * description, and a complexity table with non-empty entries.
 */
export function validateSorting(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const algorithm of sortingAlgorithms) {
    if (!algorithm.id) problems.push("algorithm with no id");
    if (seen.has(algorithm.id)) problems.push(`${algorithm.id}: duplicate id`);
    seen.add(algorithm.id);
    if (!algorithm.name) problems.push(`${algorithm.id}: no name`);
    if (!algorithm.category) problems.push(`${algorithm.id}: no category`);
    if (!algorithm.description) problems.push(`${algorithm.id}: no description`);
    const { best, average, worst, space } = algorithm.complexity;
    if (!best || !average || !worst || !space) {
      problems.push(`${algorithm.id}: incomplete complexity table`);
    }
  }
  return problems;
}
