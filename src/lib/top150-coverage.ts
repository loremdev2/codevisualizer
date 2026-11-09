// ---------------------------------------------------------------------------
// Lightweight Top Interview 150 coverage metadata.
//
// This module deliberately contains NO solution code — just the problem
// numbers that have templates/brutes — so the /learn page (which only needs
// to render Visualize buttons and Coming-soon badges) stays a few KB instead
// of shipping the full 1 MB+ of solution strings. The visualizer imports the
// heavy registries directly.
// ---------------------------------------------------------------------------

export const TOP150_TRACED_NUMBERS: number[] = [
  88, 27, 26, 80, 169, 189, 121, 122, 55, 45, 274, 238, 134, 42, 13, 12, 58, 14, 151, 6, 28, 125, 392,
  167, 11, 15, 209, 3, 76, 36, 54, 48, 73, 383, 205, 290, 242, 49, 1, 202, 219, 128, 228, 56, 57, 452,
  20, 71, 150, 2, 21, 19, 82, 61, 86, 92, 104, 100, 226, 101, 112, 129, 102, 637, 199, 103, 98, 530,
  230, 236, 114, 105, 106, 222, 200, 130, 207, 210, 17, 77, 46, 39, 22, 79, 108, 53, 918, 35, 74, 162,
  33, 34, 153, 4, 215, 67, 190, 191, 136, 137, 201, 9, 66, 172, 69, 50, 70, 198, 139, 322, 300, 120,
  64, 63, 5, 72, 221,
];

export const TOP150_BRUTE_NUMBERS: number[] = [
  88, 27, 26, 80, 169, 189, 121, 55, 45, 274, 238, 134, 42, 13, 125, 167, 11, 15, 209, 3, 76, 48, 73,
  383, 242, 49, 1, 219, 128, 20, 21, 19, 82, 61, 86, 92, 100, 101, 98, 530, 230, 236, 114, 222, 53,
  918, 35, 74, 162, 33, 34, 153, 4, 215, 67, 190, 191, 136, 137, 201, 9, 66, 172, 69, 50, 70, 198,
  139, 322, 120, 64, 63, 5, 72, 221,
];

/** Questions that also ship Python + TypeScript solutions (wave 1). */
export const TOP150_MULTILANG_NUMBERS: number[] = [
  88, 121, 42, 13, 125, 15, 3, 76, 48, 1, 49, 20, 2, 21, 98, 226, 200, 46, 108, 53, 33, 35, 215, 136,
  9, 50, 70, 198, 5, 64,
];

/**
 * NeetCode Roadmap problems with verified templates in neetcode-templates.ts.
 * Kept here (lightweight, no solution strings) so the /learn page can light up
 * the Visualize button for the NeetCode bank without shipping template code.
 * These numbers are mutually exclusive with the Top 150 registry's.
 */
export const NEETCODE_TRACED_NUMBERS: number[] = [7, 40, 43, 47, 51, 62, 75, 78, 90, 91, 93, 94, 96, 110, 118, 131, 144, 145, 152, 179, 203, 206, 213, 217, 234, 235, 252, 253, 263, 268, 279, 283, 286, 287, 329, 338, 343, 344, 347, 367, 371, 377, 416, 417, 424, 435, 438, 441, 448, 450, 455, 463, 494, 496, 513, 516, 518, 543, 560, 567, 572, 583, 605, 606, 617, 621, 669, 673, 680, 682, 684, 695, 701, 704, 724, 735, 739, 746, 763, 846, 853, 875, 876, 881, 912, 929, 931, 951, 973, 977, 1029, 1041, 1046, 1048, 1091, 1094, 1143, 1189, 1209, 1288, 1299, 1312, 1448, 1461, 1498, 1584, 1911, 1921, 1929, 2028, 2130];

const traced = new Set(TOP150_TRACED_NUMBERS);
const brute = new Set(TOP150_BRUTE_NUMBERS);
const multilang = new Set(TOP150_MULTILANG_NUMBERS);
const neetcodeTraced = new Set(NEETCODE_TRACED_NUMBERS);

export function hasTop150Template(no: number): boolean {
  return traced.has(no);
}

/** True when the problem has a verified template in the NeetCode registry. */
export function hasNeetCodeTemplate(no: number): boolean {
  return neetcodeTraced.has(no);
}

export function hasTop150Brute(no: number): boolean {
  return brute.has(no);
}

/** True when the question ships solutions in JS, TypeScript, and Python. */
export function hasTop150MultiLang(no: number): boolean {
  return multilang.has(no);
}

/** Deep-link id used by the visualizer: /visualizer?t=top150-<no> */
export function top150TemplateId(no: number): string {
  return `top150-${no}`;
}
