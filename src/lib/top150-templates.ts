// ---------------------------------------------------------------------------
// Top Interview 150 — traceable templates.
//
// Each entry pairs a canonical LeetCode-format solution (`class Solution { …
// }`) with the problem's own example input. The visualizer's LeetCode harness
// maps the input JSON onto the method parameters and converts array inputs
// into ListNode / TreeNode chains, so clicking "Visualize" on a question runs
// the real algorithm with a real trace. `expected` is the worker-serialized
// result (linked lists → value arrays, trees → level-order) and is asserted
// in top150-templates.test.ts — a template only ships if it traces cleanly
// AND produces the right answer.
//
// Wave 1 covers the questions that trace well (arrays, two pointers, sliding
// window, hashmaps, intervals, stacks, linked lists, trees, graphs, binary
// search, bit manipulation, math, DP). Design/state-machine problems (LRU
// Cache, Min Stack, Trie, Median from Data Stream, …) and trace-hostile
// giants are queued for a later wave.
// ---------------------------------------------------------------------------

import type { AlgorithmTemplate } from "@/types/visualizer";
import { top150MultiLang } from "./top150-multilang";

export type Top150Template = {
  /** LeetCode problem number. */
  no: number;
  /** Canonical JS solution in LeetCode format (class Solution). */
  code: string;
  /** Python variant of the optimal solution (class Solution: style). */
  pythonCode?: string;
  /** TypeScript variant (same algorithm, annotated). */
  typescriptCode?: string;
  /** Naive JS variant, when one exists. */
  bruteCode?: string;
  /** Naive Python variant, when one exists. */
  brutePythonCode?: string;
  /** Naive TypeScript variant, when one exists. */
  bruteTypeScriptCode?: string;
  /** The problem's example input, matching the method's parameter names. */
  input: Record<string, unknown>;
  /** Expected result (worker-serialized: lists → arrays, trees → level-order). */
  expected?: unknown;
  /** Pre-written code per language. Populated from the individual fields above. */
  languages?: Partial<Record<string, string>>;
  /** Brute-force variants per language. */
  bruteLanguages?: Partial<Record<string, string>>;
  /** Curated test cases for the input selector. */
  examples?: Array<{ label: string; input: Record<string, unknown>; expected?: unknown }>;
};

export const top150Templates: Record<number, Top150Template> = {
  // ── Array / String ───────────────────────────────────────────────────────
  88: {
    no: 88,
    code: `class Solution {
  merge(nums1, m, nums2, n) {
    let i = m - 1;
    let j = n - 1;
    let k = m + n - 1;
    while (j >= 0) {
      if (i >= 0 && nums1[i] > nums2[j]) {
        nums1[k] = nums1[i];
        i--;
      } else {
        nums1[k] = nums2[j];
        j--;
      }
      k--;
    }
  }
}`,
    input: { nums1: [1, 2, 3, 0, 0, 0], m: 3, nums2: [2, 5, 6], n: 3 },
    expected: [1, 2, 2, 3, 5, 6],
    examples: [
      { label: "Edge: m=0", input: { nums1: [0], m: 0, nums2: [1], n: 1 }, expected: [1] },
      { label: "No merge", input: { nums1: [1], m: 1, nums2: [], n: 0 }, expected: [1] },
      { label: "Classic", input: { nums1: [1,2,3,0,0,0], m: 3, nums2: [2,5,6], n: 3 }, expected: [1,2,2,3,5,6] }
    ],
  },
  27: {
    no: 27,
    code: `class Solution {
  removeElement(nums, val) {
    let k = 0;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] !== val) {
        nums[k] = nums[i];
        k++;
      }
    }
    return k;
  }
}`,
    input: { nums: [3, 2, 2, 3], val: 3 },
    expected: 2,
    examples: [
      { label: "Edge: [1],val=1", input: { nums: [1], val: 1 }, expected: 0 },
      { label: "Typical", input: { nums: [3,2,2,3], val: 3 }, expected: 2 },
      { label: "All match", input: { nums: [4,5], val: 4 }, expected: 1 }
    ],
  },
  26: {
    no: 26,
    code: `class Solution {
  removeDuplicates(nums) {
    if (nums.length === 0) return 0;
    let k = 1;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] !== nums[k - 1]) {
        nums[k] = nums[i];
        k++;
      }
    }
    return k;
  }
}`,
    input: { nums: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] },
    expected: 5,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 1 },
      { label: "Typical", input: { nums: [1,1,2] }, expected: 2 },
      { label: "All same", input: { nums: [1,1,1,2,2,3] }, expected: 3 }
    ],
  },
  80: {
    no: 80,
    code: `class Solution {
  removeDuplicates(nums) {
    let k = 0;
    for (const num of nums) {
      if (k < 2 || num > nums[k - 2]) {
        nums[k] = num;
        k++;
      }
    }
    return k;
  }
}`,
    input: { nums: [1, 1, 1, 2, 2, 3] },
    expected: 5,
    examples: [
      { label: "Edge: [1,1]", input: { nums: [1,1] }, expected: 2 },
      { label: "All same", input: { nums: [1,1,1,1] }, expected: 2 },
      { label: "Classic", input: { nums: [1,1,1,2,2,3] }, expected: 5 }
    ],
  },
  169: {
    no: 169,
    code: `class Solution {
  majorityElement(nums) {
    let candidate = nums[0];
    let count = 0;
    for (const num of nums) {
      if (count === 0) candidate = num;
      count += num === candidate ? 1 : -1;
    }
    return candidate;
  }
}`,
    input: { nums: [2, 2, 1, 1, 1, 2, 2] },
    expected: 2,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 1 },
      { label: "Typical", input: { nums: [3,2,3] }, expected: 3 },
      { label: "Classic", input: { nums: [2,2,1,1,1,2,2] }, expected: 2 }
    ],
  },
  189: {
    no: 189,
    code: `class Solution {
  rotate(nums, k) {
    k = k % nums.length;
    this.reverse(nums, 0, nums.length - 1);
    this.reverse(nums, 0, k - 1);
    this.reverse(nums, k, nums.length - 1);
  }
  reverse(nums, start, end) {
    while (start < end) {
      const temp = nums[start];
      nums[start] = nums[end];
      nums[end] = temp;
      start++;
      end--;
    }
  }
}`,
    input: { nums: [1, 2, 3, 4, 5, 6, 7], k: 3 },
    expected: [5, 6, 7, 1, 2, 3, 4],
    examples: [
      { label: "Edge: [1],k=0", input: { nums: [1], k: 0 }, expected: [1] },
      { label: "Full", input: { nums: [1,2,3], k: 3 }, expected: [1,2,3] },
      { label: "Classic", input: { nums: [1,2,3,4,5,6,7], k: 3 }, expected: [5,6,7,1,2,3,4] }
    ],
  },
  121: {
    no: 121,
    code: `class Solution {
  maxProfit(prices) {
    let minPrice = Infinity;
    let best = 0;
    for (const price of prices) {
      minPrice = Math.min(minPrice, price);
      best = Math.max(best, price - minPrice);
    }
    return best;
  }
}`,
    input: { prices: [7, 1, 5, 3, 6, 4] },
    expected: 5,
    examples: [
      { label: "All descending", input: { prices: [7,6,4,3,1] }, expected: 0 },
      { label: "All same", input: { prices: [3,3,3] }, expected: 0 },
      { label: "Classic", input: { prices: [7,1,5,3,6,4] }, expected: 5 }
    ],
  },
  122: {
    no: 122,
    code: `class Solution {
  maxProfit(prices) {
    let profit = 0;
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
    }
    return profit;
  }
}`,
    input: { prices: [7, 1, 5, 3, 6, 4] },
    expected: 7,
    examples: [
      { label: "Edge: [1]", input: { prices: [1] }, expected: 0 },
      { label: "Rising", input: { prices: [1,2,3,4,5] }, expected: 4 },
      { label: "Classic", input: { prices: [7,1,5,3,6,4] }, expected: 7 }
    ],
  },
  55: {
    no: 55,
    code: `class Solution {
  canJump(nums) {
    let reach = 0;
    for (let i = 0; i < nums.length; i++) {
      if (i > reach) return false;
      reach = Math.max(reach, i + nums[i]);
    }
    return true;
  }
}`,
    input: { nums: [2, 3, 1, 1, 4] },
    expected: true,
    examples: [
      { label: "Edge: [0]", input: { nums: [0] }, expected: true },
      { label: "Can't reach", input: { nums: [3,2,1,0,4] }, expected: false },
      { label: "Classic", input: { nums: [2,3,1,1,4] }, expected: true }
    ],
  },
  45: {
    no: 45,
    code: `class Solution {
  jump(nums) {
    let jumps = 0;
    let currentEnd = 0;
    let farthest = 0;
    for (let i = 0; i < nums.length - 1; i++) {
      farthest = Math.max(farthest, i + nums[i]);
      if (i === currentEnd) {
        jumps++;
        currentEnd = farthest;
      }
    }
    return jumps;
  }
}`,
    input: { nums: [2, 3, 1, 1, 4] },
    expected: 2,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 0 },
      { label: "Typical", input: { nums: [2,3,1,1,4] }, expected: 2 },
      { label: "Linear", input: { nums: [1,1,1,1] }, expected: 3 }
    ],
  },
  274: {
    no: 274,
    code: `class Solution {
  hIndex(citations) {
    citations.sort((a, b) => a - b);
    const n = citations.length;
    for (let i = 0; i < n; i++) {
      if (citations[i] >= n - i) return n - i;
    }
    return 0;
  }
}`,
    input: { citations: [3, 0, 6, 1, 5] },
    expected: 3,
    examples: [
      { label: "Edge: [0]", input: { citations: [0] }, expected: 0 },
      { label: "All same", input: { citations: [3,3,3] }, expected: 3 },
      { label: "Classic", input: { citations: [3,0,6,1,5] }, expected: 3 }
    ],
  },
  238: {
    no: 238,
    code: `class Solution {
  productExceptSelf(nums) {
    const n = nums.length;
    const answer = new Array(n).fill(1);
    let prefix = 1;
    for (let i = 0; i < n; i++) {
      answer[i] = prefix;
      prefix *= nums[i];
    }
    let suffix = 1;
    for (let i = n - 1; i >= 0; i--) {
      answer[i] *= suffix;
      suffix *= nums[i];
    }
    return answer;
  }
}`,
    input: { nums: [1, 2, 3, 4] },
    bruteCode: `class Solution {
  productExceptSelf(nums) {
    const result = [];
    for (let i = 0; i < nums.length; i++) {
      let product = 1;
      for (let j = 0; j < nums.length; j++) {
        if (i !== j) product *= nums[j];
      }
      result.push(product);
    }
    return result;
  }
}`,
    expected: [24, 12, 8, 6],
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: [1] },
      { label: "With zero", input: { nums: [-1,1,0,-3,3] }, expected: [0,0,9,0,0] },
      { label: "Classic", input: { nums: [1,2,3,4] }, expected: [24,12,8,6] }
    ],
  },
  134: {
    no: 134,
    code: `class Solution {
  canCompleteCircuit(gas, cost) {
    let total = 0;
    let current = 0;
    let start = 0;
    for (let i = 0; i < gas.length; i++) {
      total += gas[i] - cost[i];
      current += gas[i] - cost[i];
      if (current < 0) {
        start = i + 1;
        current = 0;
      }
    }
    return total < 0 ? -1 : start;
  }
}`,
    input: { gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] },
    expected: 3,
    examples: [
      { label: "Edge: [1]", input: { gas: [1], cost: [1] }, expected: 0 },
      { label: "No solution", input: { gas: [2,3,4], cost: [3,4,3] }, expected: -1 },
      { label: "Classic", input: { gas: [1,2,3,4,5], cost: [3,4,5,1,2] }, expected: 3 }
    ],
  },
  42: {
    no: 42,
    code: `class Solution {
  trap(height) {
    let left = 0;
    let right = height.length - 1;
    let leftMax = 0;
    let rightMax = 0;
    let water = 0;
    while (left < right) {
      if (height[left] < height[right]) {
        if (height[left] >= leftMax) leftMax = height[left];
        else water += leftMax - height[left];
        left++;
      } else {
        if (height[right] >= rightMax) rightMax = height[right];
        else water += rightMax - height[right];
        right--;
      }
    }
    return water;
  }
}`,
    input: { height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] },
    expected: 6,
    bruteCode: `class Solution {
  trap(height) {
    let total = 0;
    for (let i = 0; i < height.length; i++) {
      let leftMax = 0, rightMax = 0;
      for (let j = 0; j <= i; j++) leftMax = Math.max(leftMax, height[j]);
      for (let j = i; j < height.length; j++) rightMax = Math.max(rightMax, height[j]);
      total += Math.min(leftMax, rightMax) - height[i];
    }
    return total;
  }
}`,
    examples: [
      { label: "Simple valley", input: { height: [4,2,0,3,2,5] }, expected: 9 },
      { label: "No trapping", input: { height: [1,2,3,4,5] }, expected: 0 },
      { label: "Two bars", input: { height: [4,2] }, expected: 0 }
    ],
  },
  13: {
    no: 13,
    code: `class Solution {
  romanToInt(s) {
    const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    for (let i = 0; i < s.length; i++) {
      const current = values[s[i]];
      const next = values[s[i + 1]];
      if (next > current) total -= current;
      else total += current;
    }
    return total;
  }
}`,
    input: { s: "MCMXCIV" },
    expected: 1994,
    examples: [
      { label: "Edge: \"I\"", input: { s: "I" }, expected: 1 },
      { label: "Typical", input: { s: "III" }, expected: 3 },
      { label: "Complex", input: { s: "MCMXCIV" }, expected: 1994 }
    ],
  },
  12: {
    no: 12,
    code: `class Solution {
  intToRoman(num) {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
    let result = "";
    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += symbols[i];
        num -= values[i];
      }
    }
    return result;
  }
}`,
    input: { num: 1994 },
    expected: "MCMXCIV",
    examples: [
      { label: "Edge: 1", input: { num: 1 }, expected: "I" },
      { label: "Typical", input: { num: 3 }, expected: "III" },
      { label: "Large", input: { num: 1994 }, expected: "MCMXCIV" }
    ],
  },
  58: {
    no: 58,
    code: `class Solution {
  lengthOfLastWord(s) {
    let length = 0;
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i] === " ") {
        if (length > 0) return length;
      } else {
        length++;
      }
    }
    return length;
  }
}`,
    input: { s: "   fly me   to   the moon  " },
    expected: 4,
    examples: [
      { label: "Edge: \"a\"", input: { s: "a" }, expected: 1 },
      { label: "Trailing spaces", input: { s: "   fly me   to   the moon  " }, expected: 4 },
      { label: "Classic", input: { s: "Hello World" }, expected: 5 }
    ],
  },
  14: {
    no: 14,
    code: `class Solution {
  longestCommonPrefix(strs) {
    if (strs.length === 0) return "";
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++) {
      while (strs[i].indexOf(prefix) !== 0) {
        prefix = prefix.slice(0, prefix.length - 1);
        if (prefix === "") return "";
      }
    }
    return prefix;
  }
}`,
    input: { strs: ["flower", "flow", "flight"] },
    expected: "fl",
    examples: [
      { label: "Edge: [\"a\"]", input: { strs: ["a"] }, expected: "a" },
      { label: "Typical", input: { strs: ["flower","flow","flight"] }, expected: "fl" },
      { label: "No prefix", input: { strs: ["dog","racecar","car"] }, expected: "" }
    ],
  },
  151: {
    no: 151,
    code: `class Solution {
  reverseWords(s) {
    const words = s.trim().split(/\\s+/);
    words.reverse();
    return words.join(" ");
  }
}`,
    input: { s: "the sky is blue" },
    expected: "blue is sky the",
    examples: [
      { label: "Edge: \"a\"", input: { s: "a" }, expected: "a" },
      { label: "Extra spaces", input: { s: "  hello world  " }, expected: "world hello" },
      { label: "Classic", input: { s: "the sky is blue" }, expected: "blue is sky the" }
    ],
  },
  6: {
    no: 6,
    code: `class Solution {
  convert(s, numRows) {
    if (numRows === 1) return s;
    const rows = new Array(Math.min(numRows, s.length)).fill("");
    let current = 0;
    let goingDown = false;
    for (const char of s) {
      rows[current] += char;
      if (current === 0 || current === numRows - 1) goingDown = !goingDown;
      current += goingDown ? 1 : -1;
    }
    return rows.join("");
  }
}`,
    input: { s: "PAYPALISHIRING", numRows: 3 },
    expected: "PAHNAPLSIIGYIR",
    examples: [
      { label: "Edge: \"a\"", input: { s: "a", numRows: 1 }, expected: "a" },
      { label: "n=2", input: { s: "PAYPALISHIRING", numRows: 2 }, expected: "PYAIHLSNIGIR" },
      { label: "Classic", input: { s: "PAYPALISHIRING", numRows: 3 }, expected: "PAHNAPLSIIGYIR" }
    ],
  },
  28: {
    no: 28,
    code: `class Solution {
  strStr(haystack, needle) {
    if (needle === "") return 0;
    return haystack.indexOf(needle);
  }
}`,
    input: { haystack: "sadbutsad", needle: "sad" },
    expected: 0,
    examples: [
      { label: "Edge: empty", input: { haystack: "", needle: "" }, expected: 0 },
      { label: "Typical", input: { haystack: "sadbutsad", needle: "sad" }, expected: 0 },
      { label: "Not found", input: { haystack: "leetcode", needle: "leeto" }, expected: -1 }
    ],
  },

  // ── Two Pointers ─────────────────────────────────────────────────────────
  125: {
    no: 125,
    code: `class Solution {
  isPalindrome(s) {
    let left = 0;
    let right = s.length - 1;
    while (left < right) {
      while (left < right && !this.isAlnum(s[left])) left++;
      while (left < right && !this.isAlnum(s[right])) right--;
      if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
      left++;
      right--;
    }
    return true;
  }
  isAlnum(char) {
    return /[a-zA-Z0-9]/.test(char);
  }
}`,
    input: { s: "A man, a plan, a canal: Panama" },
    expected: true,
    examples: [
      { label: "Edge: \"\"", input: { s: "" }, expected: true },
      { label: "Not pal", input: { s: "race a car" }, expected: false },
      { label: "Classic", input: { s: "A man, a plan, a canal: Panama" }, expected: true }
    ],
  },
  392: {
    no: 392,
    code: `class Solution {
  isSubsequence(s, t) {
    let i = 0;
    let j = 0;
    while (i < s.length && j < t.length) {
      if (s[i] === t[j]) i++;
      j++;
    }
    return i === s.length;
  }
}`,
    input: { s: "abc", t: "ahbgdc" },
    expected: true,
    examples: [
      { label: "Edge: \"\"", input: { s: "", t: "ahbgdc" }, expected: true },
      { label: "Not sub", input: { s: "axc", t: "ahbgdc" }, expected: false },
      { label: "Classic", input: { s: "abc", t: "ahbgdc" }, expected: true }
    ],
  },
  167: {
    no: 167,
    code: `class Solution {
  twoSum(numbers, target) {
    let left = 0;
    let right = numbers.length - 1;
    while (left < right) {
      const sum = numbers[left] + numbers[right];
      if (sum === target) return [left + 1, right + 1];
      if (sum < target) left++;
      else right--;
    }
    return [];
  }
}`,
    input: { numbers: [2, 7, 11, 15], target: 9 },
    expected: [1, 2],
    examples: [
      { label: "Edge: [0,1],t=1", input: { numbers: [0,1], target: 1 }, expected: [1,2] },
      { label: "Negatives", input: { numbers: [-1,0], target: -1 }, expected: [1,2] },
      { label: "Classic", input: { numbers: [2,7,11,15], target: 9 }, expected: [1,2] }
    ],
  },
  11: {
    no: 11,
    code: `class Solution {
  maxArea(height) {
    let left = 0;
    let right = height.length - 1;
    let best = 0;
    while (left < right) {
      const width = right - left;
      best = Math.max(best, Math.min(height[left], height[right]) * width);
      if (height[left] < height[right]) left++;
      else right--;
    }
    return best;
  }
}`,
    input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
    expected: 49,
    bruteCode: `class Solution {
  maxArea(height) {
    let best = 0;
    for (let i = 0; i < height.length; i++) {
      for (let j = i + 1; j < height.length; j++) {
        best = Math.max(best, Math.min(height[i], height[j]) * (j - i));
      }
    }
    return best;
  }
}`,
    examples: [
      { label: "Edge: [1,1]", input: { height: [1,1] }, expected: 1 },
      { label: "Classic", input: { height: [1,8,6,2,5,4,8,3,7] }, expected: 49 },
      { label: "All same", input: { height: [4,3,2,1,4] }, expected: 16 }
    ],
  },
  15: {
    no: 15,
    code: `class Solution {
  threeSum(nums) {
    nums.sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < nums.length - 2; i++) {
      if (i > 0 && nums[i] === nums[i - 1]) continue;
      let left = i + 1;
      let right = nums.length - 1;
      while (left < right) {
        const sum = nums[i] + nums[left] + nums[right];
        if (sum === 0) {
          result.push([nums[i], nums[left], nums[right]]);
          while (left < right && nums[left] === nums[left + 1]) left++;
          while (left < right && nums[right] === nums[right - 1]) right--;
          left++;
          right--;
        } else if (sum < 0) {
          left++;
        } else {
          right--;
        }
      }
    }
    return result;
  }
}`,
    input: { nums: [-1, 0, 1, 2, -1, -4] },
    expected: [
      [-1, -1, 2],
      [-1, 0, 1],
    ],
    bruteCode: `class Solution {
  threeSum(nums) {
    const result = [];
    nums.sort((a, b) => a - b);
    for (let i = 0; i < nums.length - 2; i++) {
      for (let j = i + 1; j < nums.length - 1; j++) {
        for (let k = j + 1; k < nums.length; k++) {
          if (nums[i] + nums[j] + nums[k] === 0) {
            const triple = [nums[i], nums[j], nums[k]];
            if (!result.some(r => r[0] === triple[0] && r[1] === triple[1] && r[2] === triple[2])) {
              result.push(triple);
            }
          }
        }
      }
    }
    return result;
  }
}`,
    examples: [
      { label: "Edge: [0]", input: { nums: [0] }, expected: [] },
      { label: "Typical", input: { nums: [-1,0,1,2,-1,-4] }, expected: [[-1,-1,2],[-1,0,1]] },
      { label: "All zeros", input: { nums: [0,0,0] }, expected: [[0,0,0]] }
    ],
  },

  // ── Sliding Window ───────────────────────────────────────────────────────
  209: {
    no: 209,
    code: `class Solution {
  minSubArrayLen(target, nums) {
    let left = 0;
    let sum = 0;
    let best = Infinity;
    for (let right = 0; right < nums.length; right++) {
      sum += nums[right];
      while (sum >= target) {
        best = Math.min(best, right - left + 1);
        sum -= nums[left];
        left++;
      }
    }
    return best === Infinity ? 0 : best;
  }
}`,
    input: { target: 7, nums: [2, 3, 1, 2, 4, 3] },
    expected: 2,
    examples: [
      { label: "Edge: s=1", input: { target: 1, nums: [1] }, expected: 1 },
      { label: "No solution", input: { target: 11, nums: [1,1,1,1,1,1,1,1] }, expected: 0 },
      { label: "Classic", input: { target: 7, nums: [2,3,1,2,4,3] }, expected: 2 }
    ],
  },
  3: {
    no: 3,
    code: `class Solution {
  lengthOfLongestSubstring(s) {
    const seen = new Map();
    let left = 0;
    let best = 0;
    for (let right = 0; right < s.length; right++) {
      const char = s[right];
      if (seen.has(char) && seen.get(char) >= left) {
        left = seen.get(char) + 1;
      }
      seen.set(char, right);
      best = Math.max(best, right - left + 1);
    }
    return best;
  }
}`,
    input: { s: "abcabcbb" },
    expected: 3,
    bruteCode: `class Solution {
  lengthOfLongestSubstring(s) {
    let best = 0;
    for (let i = 0; i < s.length; i++) {
      const seen = new Set();
      for (let j = i; j < s.length; j++) {
        if (seen.has(s[j])) break;
        seen.add(s[j]);
        best = Math.max(best, j - i + 1);
      }
    }
    return best;
  }
}`,
    examples: [
      { label: "Edge: \"a\"", input: { s: "a" }, expected: 1 },
      { label: "All same", input: { s: "bbbbb" }, expected: 1 },
      { label: "All unique", input: { s: "abcdef" }, expected: 6 }
    ],
  },
  76: {
    no: 76,
    code: `class Solution {
  minWindow(s, t) {
    const need = {};
    for (const char of t) need[char] = (need[char] || 0) + 1;
    let missing = t.length;
    let left = 0;
    let best = "";
    for (let right = 0; right < s.length; right++) {
      const char = s[right];
      if (need[char] !== undefined) {
        if (need[char] > 0) missing--;
        need[char]--;
      }
      while (missing === 0) {
        const windowLength = right - left + 1;
        if (best === "" || windowLength < best.length) {
          best = s.slice(left, right + 1);
        }
        const leftChar = s[left];
        if (need[leftChar] !== undefined) {
          need[leftChar]++;
          if (need[leftChar] > 0) missing++;
        }
        left++;
      }
    }
    return best;
  }
}`,
    input: { s: "ADOBECODEBANC", t: "ABC" },
    expected: "BANC",
    bruteCode: `class Solution {
  minWindow(s, t) {
    let best = "";
    for (let i = 0; i < s.length; i++) {
      for (let j = i; j < s.length; j++) {
        const sub = s.slice(i, j + 1);
        const need = [...t];
        for (const ch of sub) {
          const idx = need.indexOf(ch);
          if (idx !== -1) need.splice(idx, 1);
        }
        if (need.length === 0 && (best === "" || sub.length < best.length)) best = sub;
      }
    }
    return best;
  }
}`,
    examples: [
      { label: "Edge: no match", input: { s: "a", t: "aa" }, expected: "" },
      { label: "Single", input: { s: "a", t: "a" }, expected: "a" },
      { label: "Classic", input: { s: "ADOBECODEBANC", t: "ABC" }, expected: "BANC" }
    ],
  },

  // ── Matrix ───────────────────────────────────────────────────────────────
  36: {
    no: 36,
    code: `class Solution {
  isValidSudoku(board) {
    const rows = new Array(9).fill(0).map(() => new Set());
    const cols = new Array(9).fill(0).map(() => new Set());
    const boxes = new Array(9).fill(0).map(() => new Set());
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const value = board[r][c];
        if (value === ".") continue;
        const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        if (rows[r].has(value) || cols[c].has(value) || boxes[boxIndex].has(value)) return false;
        rows[r].add(value);
        cols[c].add(value);
        boxes[boxIndex].add(value);
      }
    }
    return true;
  }
}`,
    input: {
      board: [
        ["5", "3", ".", ".", "7", ".", ".", ".", "."],
        ["6", ".", ".", "1", "9", "5", ".", ".", "."],
        [".", "9", "8", ".", ".", ".", ".", "6", "."],
        ["8", ".", ".", ".", "6", ".", ".", ".", "3"],
        ["4", ".", ".", "8", ".", "3", ".", ".", "1"],
        ["7", ".", ".", ".", "2", ".", ".", ".", "6"],
        [".", "6", ".", ".", ".", ".", "2", "8", "."],
        [".", ".", ".", "4", "1", "9", ".", ".", "5"],
        [".", ".", ".", ".", "8", ".", ".", "7", "9"],
      ],
    examples: [
      { label: "Edge: [[\".\"]]", input: { board: [["."]] }, expected: null },
      { label: "Classic", input: { board: [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]] }, expected: null },
      { label: "Invalid row", input: { board: [["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]] }, expected: null }
    ],
    },
    expected: true,
  },
  54: {
    no: 54,
    code: `class Solution {
  spiralOrder(matrix) {
    const result = [];
    let top = 0;
    let bottom = matrix.length - 1;
    let left = 0;
    let right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) result.push(matrix[top][c]);
      top++;
      for (let r = top; r <= bottom; r++) result.push(matrix[r][right]);
      right--;
      if (top <= bottom) {
        for (let c = right; c >= left; c--) result.push(matrix[bottom][c]);
        bottom--;
      }
      if (left <= right) {
        for (let r = bottom; r >= top; r--) result.push(matrix[r][left]);
        left++;
      }
    }
    return result;
  }
}`,
    input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
    expected: [1, 2, 3, 6, 9, 8, 7, 4, 5],
    examples: [
      { label: "Edge: [[1]]", input: { matrix: [[1]] }, expected: [1] },
      { label: "Single col", input: { matrix: [[1],[2],[3]] }, expected: [1,2,3] },
      { label: "Classic", input: { matrix: [[1,2,3],[4,5,6],[7,8,9]] }, expected: [1,2,3,6,9,8,7,4,5] }
    ],
  },
  48: {
    no: 48,
    code: `class Solution {
  rotate(matrix) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const temp = matrix[i][j];
        matrix[i][j] = matrix[j][i];
        matrix[j][i] = temp;
      }
    }
    for (const row of matrix) {
      let i = 0;
      let j = row.length - 1;
      while (i < j) {
        const temp = row[i];
        row[i] = row[j];
        row[j] = temp;
        i++;
        j--;
      }
    }
  }
}`,
    input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
    expected: [[7, 4, 1], [8, 5, 2], [9, 6, 3]],
    examples: [
      { label: "Edge: [[1]]", input: { matrix: [[1]] }, expected: [[1]] },
      { label: "2x2", input: { matrix: [[1,2],[3,4]] }, expected: [[3,1],[4,2]] },
      { label: "Classic", input: { matrix: [[1,2,3],[4,5,6],[7,8,9]] }, expected: [[7,4,1],[8,5,2],[9,6,3]] }
    ],
  },
  73: {
    no: 73,
    code: `class Solution {
  setZeroes(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const zeroRows = new Array(rows).fill(false);
    const zeroCols = new Array(cols).fill(false);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === 0) {
          zeroRows[r] = true;
          zeroCols[c] = true;
        }
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (zeroRows[r] || zeroCols[c]) matrix[r][c] = 0;
      }
    }
  }
}`,
    input: { matrix: [[1, 1, 1], [1, 0, 1], [1, 1, 1]] },
    expected: [[1, 0, 1], [0, 0, 0], [1, 0, 1]],
    examples: [
      { label: "Edge: [[0]]", input: { matrix: [[0]] }, expected: [[0]] },
      { label: "No zeros", input: { matrix: [[1,2,3],[4,5,6]] }, expected: [[1,2,3],[4,5,6]] },
      { label: "Classic", input: { matrix: [[1,1,1],[1,0,1],[1,1,1]] }, expected: [[1,0,1],[0,0,0],[1,0,1]] }
    ],
  },

  // ── Hashmap ──────────────────────────────────────────────────────────────
  383: {
    no: 383,
    code: `class Solution {
  canConstruct(ransomNote, magazine) {
    const counts = {};
    for (const char of magazine) counts[char] = (counts[char] || 0) + 1;
    for (const char of ransomNote) {
      if (!counts[char]) return false;
      counts[char]--;
    }
    return true;
  }
}`,
    input: { ransomNote: "aa", magazine: "aab" },
    expected: true,
    examples: [
      { label: "Edge: \"\"", input: { ransomNote: "", magazine: "" }, expected: true },
      { label: "Impossible", input: { ransomNote: "a", magazine: "b" }, expected: false },
      { label: "Classic", input: { ransomNote: "aa", magazine: "aab" }, expected: true }
    ],
  },
  205: {
    no: 205,
    code: `class Solution {
  isIsomorphic(s, t) {
    const mapST = {};
    const mapTS = {};
    for (let i = 0; i < s.length; i++) {
      const a = s[i];
      const b = t[i];
      if (mapST[a] === undefined && mapTS[b] === undefined) {
        mapST[a] = b;
        mapTS[b] = a;
      } else if (mapST[a] !== b || mapTS[b] !== a) {
        return false;
      }
    }
    return true;
  }
}`,
    input: { s: "egg", t: "add" },
    expected: true,
    examples: [
      { label: "Edge: \"\"", input: { s: "", t: "" }, expected: true },
      { label: "Not iso", input: { s: "foo", t: "bar" }, expected: false },
      { label: "Classic", input: { s: "egg", t: "add" }, expected: true }
    ],
  },
  290: {
    no: 290,
    code: `class Solution {
  wordPattern(pattern, s) {
    const words = s.split(" ");
    if (pattern.length !== words.length) return false;
    const map = {};
    const seen = new Set();
    for (let i = 0; i < pattern.length; i++) {
      const key = pattern[i];
      const word = words[i];
      if (map[key] === undefined) {
        if (seen.has(word)) return false;
        map[key] = word;
        seen.add(word);
      } else if (map[key] !== word) {
        return false;
      }
    }
    return true;
  }
}`,
    input: { pattern: "abba", s: "dog cat cat dog" },
    expected: true,
    examples: [
      { label: "Edge: \"\"", input: { pattern: "", s: "" }, expected: true },
      { label: "Not iso", input: { pattern: "abba", s: "dog cat cat fish" }, expected: false },
      { label: "Classic", input: { pattern: "abba", s: "dog cat cat dog" }, expected: true }
    ],
  },
  242: {
    no: 242,
    code: `class Solution {
  isAnagram(s, t) {
    if (s.length !== t.length) return false;
    const counts = {};
    for (const char of s) counts[char] = (counts[char] || 0) + 1;
    for (const char of t) {
      if (!counts[char]) return false;
      counts[char]--;
    }
    return true;
  }
}`,
    input: { s: "anagram", t: "nagaram" },
    expected: true,
    examples: [
      { label: "Edge: \"\"", input: { s: "", t: "" }, expected: true },
      { label: "Different", input: { s: "rat", t: "car" }, expected: false },
      { label: "Classic", input: { s: "anagram", t: "nagaram" }, expected: true }
    ],
  },
  49: {
    no: 49,
    code: `class Solution {
  groupAnagrams(strs) {
    const groups = new Map();
    for (const str of strs) {
      const key = str.split("").sort().join("");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(str);
    }
    return Array.from(groups.values());
  }
}`,
    input: { strs: ["eat", "tea", "tan", "ate", "nat", "bat"] },
    expected: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]],
    examples: [
      { label: "Edge: [\"\"]", input: { strs: [""] }, expected: [[""]] },
      { label: "All same", input: { strs: ["a","a"] }, expected: [["a","a"]] },
      { label: "Classic", input: { strs: ["eat","tea","tan","ate","nat","bat"] }, expected: [["eat","tea","ate"],["tan","nat"],["bat"]] }
    ],
  },
  1: {
    no: 1,
    code: `class Solution {
  twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (seen.has(complement)) return [seen.get(complement), i];
      seen.set(nums[i], i);
    }
    return [];
  }
}`,
    input: { nums: [2, 7, 11, 15], target: 9 },
    expected: [0, 1],
    bruteCode: `class Solution {
  twoSum(nums, target) {
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] === target) return [i, j];
      }
    }
    return [];
  }
}`,
    examples: [
      { label: "Edge: [3,3]", input: { nums: [3,3], target: 6 }, expected: [0,1] },
      { label: "Classic", input: { nums: [2,7,11,15], target: 9 }, expected: [0,1] },
      { label: "No match", input: { nums: [1,2,3], target: 10 }, expected: [] }
    ],
  },
  202: {
    no: 202,
    code: `class Solution {
  isHappy(n) {
    const seen = new Set();
    while (n !== 1 && !seen.has(n)) {
      seen.add(n);
      let sum = 0;
      while (n > 0) {
        const digit = n % 10;
        sum += digit * digit;
        n = Math.floor(n / 10);
      }
      n = sum;
    }
    return n === 1;
  }
}`,
    input: { n: 19 },
    expected: true,
    examples: [
      { label: "Edge: 1", input: { n: 1 }, expected: true },
      { label: "Not happy", input: { n: 2 }, expected: false },
      { label: "Classic", input: { n: 19 }, expected: true }
    ],
  },
  219: {
    no: 219,
    code: `class Solution {
  containsNearbyDuplicate(nums, k) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      if (seen.has(nums[i]) && i - seen.get(nums[i]) <= k) return true;
      seen.set(nums[i], i);
    }
    return false;
  }
}`,
    input: { nums: [1, 2, 3, 1], k: 3 },
    expected: true,
    examples: [
      { label: "Edge: [1],k=0", input: { nums: [1], k: 0 }, expected: false },
      { label: "Not close", input: { nums: [1,2,3,1,2,3], k: 2 }, expected: false },
      { label: "Classic", input: { nums: [1,2,3,1], k: 3 }, expected: true }
    ],
  },
  128: {
    no: 128,
    code: `class Solution {
  longestConsecutive(nums) {
    const set = new Set(nums);
    let best = 0;
    for (const num of set) {
      if (set.has(num - 1)) continue;
      let length = 1;
      let current = num;
      while (set.has(current + 1)) {
        current++;
        length++;
      }
      best = Math.max(best, length);
    }
    return best;
  }
}`,
    input: { nums: [100, 4, 200, 1, 3, 2] },
    bruteCode: `class Solution {
  longestConsecutive(nums) {
    if (nums.length === 0) return 0;
    const sorted = [...new Set(nums)].sort((a, b) => a - b);
    let best = 1, count = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) { count++; best = Math.max(best, count); }
      else count = 1;
    }
    return best;
  }
}`,
    expected: 4,
    examples: [
      { label: "Edge: []", input: { nums: [] }, expected: 0 },
      { label: "All same", input: { nums: [1,1,1] }, expected: 1 },
      { label: "Classic", input: { nums: [100,4,200,1,3,2] }, expected: 4 }
    ],
  },

  // ── Intervals ────────────────────────────────────────────────────────────
  228: {
    no: 228,
    code: `class Solution {
  summaryRanges(nums) {
    const result = [];
    let i = 0;
    while (i < nums.length) {
      let j = i;
      while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
      if (i === j) result.push(String(nums[i]));
      else result.push(nums[i] + "->" + nums[j]);
      i = j + 1;
    }
    return result;
  }
}`,
    input: { nums: [0, 1, 2, 4, 5, 7] },
    expected: ["0->2", "4->5", "7"],
    examples: [
      { label: "Edge: []", input: { nums: [] }, expected: [] },
      { label: "All same", input: { nums: [1,1,1] }, expected: ["1"] },
      { label: "Classic", input: { nums: [0,1,2,4,5,7] }, expected: ["0->2","4->5","7"] }
    ],
  },
  56: {
    no: 56,
    code: `class Solution {
  merge(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    const result = [];
    for (const interval of intervals) {
      const last = result[result.length - 1];
      if (last && interval[0] <= last[1]) {
        last[1] = Math.max(last[1], interval[1]);
      } else {
        result.push([interval[0], interval[1]]);
      }
    }
    return result;
  }
}`,
    input: { intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] },
    expected: [[1, 6], [8, 10], [15, 18]],
    examples: [
      { label: "Edge: [[1,4]]", input: { intervals: [[1,4]] }, expected: [[1,4]] },
      { label: "All overlap", input: { intervals: [[1,4],[4,5]] }, expected: [[1,5]] },
      { label: "Classic", input: { intervals: [[1,3],[2,6],[8,10],[15,18]] }, expected: [[1,6],[8,10],[15,18]] }
    ],
  },
  57: {
    no: 57,
    code: `class Solution {
  insert(intervals, newInterval) {
    const result = [];
    let i = 0;
    while (i < intervals.length && intervals[i][1] < newInterval[0]) {
      result.push(intervals[i]);
      i++;
    }
    while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
      newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
      newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
      i++;
    }
    result.push(newInterval);
    while (i < intervals.length) {
      result.push(intervals[i]);
      i++;
    }
    return result;
  }
}`,
    input: { intervals: [[1, 3], [6, 9]], newInterval: [2, 5] },
    expected: [[1, 5], [6, 9]],
    examples: [
      { label: "Edge: []", input: { intervals: [], newInterval: [5,7] }, expected: [[5,7]] },
      { label: "Full cover", input: { intervals: [[1,5]], newInterval: [2,3] }, expected: [[1,5]] },
      { label: "Classic", input: { intervals: [[1,3],[6,9]], newInterval: [2,5] }, expected: [[1,5],[6,9]] }
    ],
  },
  452: {
    no: 452,
    code: `class Solution {
  findMinArrowShots(points) {
    points.sort((a, b) => a[0] - b[0]);
    let arrows = 1;
    let end = points[0][1];
    for (let i = 1; i < points.length; i++) {
      if (points[i][0] > end) {
        arrows++;
        end = points[i][1];
      } else {
        end = Math.min(end, points[i][1]);
      }
    }
    return arrows;
  }
}`,
    input: { points: [[10, 16], [2, 8], [1, 6], [7, 12]] },
    expected: 2,
    examples: [
      { label: "Edge: [[0,1]]", input: { points: [[0,1]] }, expected: 1 },
      { label: "All overlap", input: { points: [[1,2],[1,2],[1,2]] }, expected: 1 },
      { label: "Classic", input: { points: [[10,16],[2,8],[1,6],[7,12]] }, expected: 2 }
    ],
  },

  // ── Stack ────────────────────────────────────────────────────────────────
  20: {
    no: 20,
    code: `class Solution {
  isValid(s) {
    const stack = [];
    const map = { ")": "(", "]": "[", "}": "{" };
    for (const char of s) {
      if (char === "(" || char === "[" || char === "{") {
        stack.push(char);
      } else if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    }
    return stack.length === 0;
  }
}`,
    input: { s: "()[]{}" },
    expected: true,
    examples: [
      { label: "Edge: \"(\"", input: { s: "(" }, expected: false },
      { label: "Nested", input: { s: "{[]}" }, expected: true },
      { label: "Classic", input: { s: "()[]{}" }, expected: true }
    ],
  },
  71: {
    no: 71,
    code: `class Solution {
  simplifyPath(path) {
    const stack = [];
    for (const part of path.split("/")) {
      if (part === "" || part === ".") continue;
      if (part === "..") {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    return "/" + stack.join("/");
  }
}`,
    input: { path: "/home//foo/" },
    expected: "/home/foo",
    examples: [
      { label: "Edge: \"/\"", input: { path: "/" }, expected: "/" },
      { label: "Navigate", input: { path: "/a/./b/../../c/" }, expected: "/c" },
      { label: "Complex", input: { path: "/a/b/../c/./d/../../e/" }, expected: "/a/e" }
    ],
  },
  150: {
    no: 150,
    code: `class Solution {
  evalRPN(tokens) {
    const stack = [];
    for (const token of tokens) {
      if (token === "+" || token === "-" || token === "*" || token === "/") {
        const b = stack.pop();
        const a = stack.pop();
        if (token === "+") stack.push(a + b);
        else if (token === "-") stack.push(a - b);
        else if (token === "*") stack.push(a * b);
        else stack.push(Math.trunc(a / b));
      } else {
        stack.push(Number(token));
      }
    }
    return stack[0];
  }
}`,
    input: { tokens: ["2", "1", "+", "3", "*"] },
    expected: 9,
    examples: [
      { label: "Edge: [\"42\"]", input: { tokens: ["42"] }, expected: 42 },
      { label: "Complex", input: { tokens: ["10","6","9","3","+","-11","*","/","*","17","+","5","+"] }, expected: 22 },
      { label: "Classic", input: { tokens: ["2","1","+","3","*"] }, expected: 9 }
    ],
  },

  // ── Linked List ──────────────────────────────────────────────────────────
  2: {
    no: 2,
    code: `class Solution {
  addTwoNumbers(l1, l2) {
    const dummy = new ListNode(0);
    let tail = dummy;
    let carry = 0;
    while (l1 !== null || l2 !== null || carry > 0) {
      const sum = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
      carry = Math.floor(sum / 10);
      tail.next = new ListNode(sum % 10);
      tail = tail.next;
      if (l1) l1 = l1.next;
      if (l2) l2 = l2.next;
    }
    return dummy.next;
  }
}`,
    input: { l1: [2, 4, 3], l2: [5, 6, 4] },
    expected: [7, 0, 8],
    examples: [
      { label: "Edge: [0]", input: { l1: [0], l2: [0] }, expected: [0] },
      { label: "Classic", input: { l1: [2,4,3], l2: [5,6,4] }, expected: [7,0,8] },
      { label: "Different len", input: { l1: [9,9,9], l2: [1] }, expected: [0,0,0,1] }
    ],
  },
  21: {
    no: 21,
    code: `class Solution {
  mergeTwoLists(l1, l2) {
    const dummy = new ListNode(0);
    let tail = dummy;
    while (l1 !== null && l2 !== null) {
      if (l1.val <= l2.val) {
        tail.next = l1;
        l1 = l1.next;
      } else {
        tail.next = l2;
        l2 = l2.next;
      }
      tail = tail.next;
    }
    tail.next = l1 !== null ? l1 : l2;
    return dummy.next;
  }
}`,
    input: { l1: [1, 2, 4], l2: [1, 3, 4] },
    expected: [1, 1, 2, 3, 4, 4],
    examples: [
      { label: "Edge: both empty", input: { list1: [], list2: [] }, expected: [] },
      { label: "Typical", input: { list1: [1,2,4], list2: [1,3,4] }, expected: [1,1,2,3,4] },
      { label: "One empty", input: { list1: [], list2: [0] }, expected: [0] }
    ],
  },
  19: {
    no: 19,
    code: `class Solution {
  removeNthFromEnd(head, n) {
    const dummy = new ListNode(0, head);
    let slow = dummy;
    let fast = head;
    for (let i = 0; i < n; i++) fast = fast.next;
    while (fast !== null) {
      slow = slow.next;
      fast = fast.next;
    }
    slow.next = slow.next.next;
    return dummy.next;
  }
}`,
    input: { head: [1, 2, 3, 4, 5], n: 2 },
    expected: [1, 2, 3, 5],
    examples: [
      { label: "Edge: [1],n=1", input: { head: [1], n: 1 }, expected: [] },
      { label: "Typical", input: { head: [1,2,3,4,5], n: 2 }, expected: [1,2,3,5] },
      { label: "Single", input: { head: [1], n: 1 }, expected: [] }
    ],
  },
  82: {
    no: 82,
    code: `class Solution {
  deleteDuplicates(head) {
    const dummy = new ListNode(0, head);
    let prev = dummy;
    while (head !== null) {
      if (head.next !== null && head.val === head.next.val) {
        while (head.next !== null && head.val === head.next.val) head = head.next;
        prev.next = head.next;
      } else {
        prev = prev.next;
      }
      head = head.next;
    }
    return dummy.next;
  }
}`,
    input: { head: [1, 2, 3, 3, 4, 4, 5] },
    expected: [1, 2, 5],
    examples: [
      { label: "Edge: [1]", input: { head: [1] }, expected: [1] },
      { label: "All same", input: { head: [1,1,1,2,3] }, expected: [2,3] },
      { label: "Classic", input: { head: [1,2,3,3,4,4,5] }, expected: [1,2,5] }
    ],
  },
  61: {
    no: 61,
    code: `class Solution {
  rotateRight(head, k) {
    if (head === null || head.next === null) return head;
    let length = 1;
    let tail = head;
    while (tail.next !== null) {
      tail = tail.next;
      length++;
    }
    k = k % length;
    if (k === 0) return head;
    tail.next = head;
    let newTail = head;
    for (let i = 0; i < length - k - 1; i++) newTail = newTail.next;
    const newHead = newTail.next;
    newTail.next = null;
    return newHead;
  }
}`,
    input: { head: [1, 2, 3, 4, 5], k: 2 },
    expected: [4, 5, 1, 2, 3],
    examples: [
      { label: "Edge: [1],k=0", input: { head: [1], k: 0 }, expected: [1] },
      { label: "No rotate", input: { head: [1,2,3], k: 3 }, expected: [1,2,3] },
      { label: "Classic", input: { head: [1,2,3,4,5], k: 2 }, expected: [4,5,1,2,3] }
    ],
  },
  86: {
    no: 86,
    code: `class Solution {
  partition(head, x) {
    const beforeHead = new ListNode(0);
    const afterHead = new ListNode(0);
    let before = beforeHead;
    let after = afterHead;
    while (head !== null) {
      if (head.val < x) {
        before.next = head;
        before = before.next;
      } else {
        after.next = head;
        after = after.next;
      }
      head = head.next;
    }
    after.next = null;
    before.next = afterHead.next;
    return beforeHead.next;
  }
}`,
    input: { head: [1, 4, 3, 2, 5, 2], x: 3 },
    expected: [1, 2, 2, 4, 3, 5],
    examples: [
      { label: "Edge: [1],x=1", input: { head: [1], x: 1 }, expected: [1] },
      { label: "All less", input: { head: [1,2], x: 3 }, expected: [1,2] },
      { label: "Classic", input: { head: [1,4,3,2,5,2], x: 3 }, expected: [1,2,2,4,3,5] }
    ],
  },
  92: {
    no: 92,
    code: `class Solution {
  reverseBetween(head, left, right) {
    const dummy = new ListNode(0, head);
    let prev = dummy;
    for (let i = 0; i < left - 1; i++) prev = prev.next;
    let curr = prev.next;
    for (let i = 0; i < right - left; i++) {
      const next = curr.next;
      curr.next = next.next;
      next.next = prev.next;
      prev.next = next;
    }
    return dummy.next;
  }
}`,
    input: { head: [1, 2, 3, 4, 5], left: 2, right: 4 },
    expected: [1, 4, 3, 2, 5],
    examples: [
      { label: "Edge: [1],1,1", input: { head: [1], left: 1, right: 1 }, expected: [1] },
      { label: "Full", input: { head: [1,2,3], left: 1, right: 3 }, expected: [3,2,1] },
      { label: "Classic", input: { head: [1,2,3,4,5], left: 2, right: 4 }, expected: [1,4,3,2,5] }
    ],
  },

  // ── Binary Tree General ──────────────────────────────────────────────────
  104: {
    no: 104,
    code: `class Solution {
  maxDepth(root) {
    if (root === null) return 0;
    return 1 + Math.max(this.maxDepth(root.left), this.maxDepth(root.right));
  }
}`,
    input: { root: [3, 9, 20, null, null, 15, 7] },
    expected: 3,
    examples: [
      { label: "Edge: []", input: { root: [] }, expected: 0 },
      { label: "Skew", input: { root: [1,2,null,3] }, expected: 3 },
      { label: "Classic", input: { root: [3,9,20,null,null,15,7] }, expected: 3 }
    ],
  },
  100: {
    no: 100,
    code: `class Solution {
  isSameTree(p, q) {
    if (p === null && q === null) return true;
    if (p === null || q === null) return false;
    if (p.val !== q.val) return false;
    return this.isSameTree(p.left, q.left) && this.isSameTree(p.right, q.right);
  }
}`,
    input: { p: [1, 2, 3], q: [1, 2, 3] },
    expected: true,
    examples: [
      { label: "Both null", input: { p: [], q: [] }, expected: true },
      { label: "Different", input: { p: [1,2], q: [1,null,2] }, expected: false },
      { label: "Classic", input: { p: [1,2,3], q: [1,2,3] }, expected: true }
    ],
  },
  226: {
    no: 226,
    code: `class Solution {
  invertTree(root) {
    if (root === null) return null;
    const left = this.invertTree(root.left);
    const right = this.invertTree(root.right);
    root.left = right;
    root.right = left;
    return root;
  }
}`,
    input: { root: [4, 2, 7, 1, 3, 6, 9] },
    expected: [4, 7, 2, 9, 6, 3, 1],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [1] },
      { label: "Left only", input: { root: [1,2] }, expected: [1,null,2] },
      { label: "Classic", input: { root: [4,2,7,1,3,6,9] }, expected: [4,7,2,9,6,3,1] }
    ],
  },
  101: {
    no: 101,
    code: `class Solution {
  isSymmetric(root) {
    return this.isMirror(root, root);
  }
  isMirror(left, right) {
    if (left === null && right === null) return true;
    if (left === null || right === null) return false;
    return left.val === right.val && this.isMirror(left.left, right.right) && this.isMirror(left.right, right.left);
  }
}`,
    input: { root: [1, 2, 2, 3, 4, 4, 3] },
    expected: true,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: true },
      { label: "Not symmetric", input: { root: [1,2,2,null,3,null,3] }, expected: false },
      { label: "Classic", input: { root: [1,2,2,3,4,4,3] }, expected: true }
    ],
  },
  112: {
    no: 112,
    code: `class Solution {
  hasPathSum(root, targetSum) {
    if (root === null) return false;
    if (root.left === null && root.right === null) return root.val === targetSum;
    return this.hasPathSum(root.left, targetSum - root.val) || this.hasPathSum(root.right, targetSum - root.val);
  }
}`,
    input: { root: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], targetSum: 22 },
    expected: true,
    examples: [
      { label: "Edge: [1],sum=1", input: { root: [1], targetSum: 1 }, expected: true },
      { label: "No path", input: { root: [1,2,3], targetSum: 5 }, expected: false },
      { label: "Classic", input: { root: [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum: 22 }, expected: true }
    ],
  },
  129: {
    no: 129,
    code: `class Solution {
  sumNumbers(root) {
    return this.dfs(root, 0);
  }
  dfs(node, current) {
    if (node === null) return 0;
    current = current * 10 + node.val;
    if (node.left === null && node.right === null) return current;
    return this.dfs(node.left, current) + this.dfs(node.right, current);
  }
}`,
    input: { root: [1, 2, 3] },
    expected: 25,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: 1 },
      { label: "Deep", input: { root: [4,9,0,5,1] }, expected: 1026 },
      { label: "Classic", input: { root: [1,2,3] }, expected: 25 }
    ],
  },
  102: {
    no: 102,
    code: `class Solution {
  levelOrder(root) {
    if (root === null) return [];
    const result = [];
    let queue = [root];
    while (queue.length > 0) {
      const level = [];
      const next = [];
      for (const node of queue) {
        level.push(node.val);
        if (node.left !== null) next.push(node.left);
        if (node.right !== null) next.push(node.right);
      }
      result.push(level);
      queue = next;
    }
    return result;
  }
}`,
    input: { root: [3, 9, 20, null, null, 15, 7] },
    expected: [[3], [9, 20], [15, 7]],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [[1]] },
      { label: "Two levels", input: { root: [1,2,3] }, expected: [[1],[2,3]] },
      { label: "Classic", input: { root: [3,9,20,null,null,15,7] }, expected: [[3],[9,20],[15,7]] }
    ],
  },
  637: {
    no: 637,
    code: `class Solution {
  averageOfLevels(root) {
    const result = [];
    let queue = [root];
    while (queue.length > 0) {
      const next = [];
      let sum = 0;
      for (const node of queue) {
        sum += node.val;
        if (node.left !== null) next.push(node.left);
        if (node.right !== null) next.push(node.right);
      }
      result.push(sum / queue.length);
      queue = next;
    }
    return result;
  }
}`,
    input: { root: [3, 9, 20, null, null, 15, 7] },
    expected: [3, 14.5, 11],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [1.0] },
      { label: "Two levels", input: { root: [1,2,3] }, expected: [1.0,2.5] },
      { label: "Classic", input: { root: [3,9,20,null,null,15,7] }, expected: [3.0,14.5,11.0] }
    ],
  },
  199: {
    no: 199,
    code: `class Solution {
  rightSideView(root) {
    const result = [];
    if (root === null) return result;
    let queue = [root];
    while (queue.length > 0) {
      result.push(queue[queue.length - 1].val);
      const next = [];
      for (const node of queue) {
        if (node.left !== null) next.push(node.left);
        if (node.right !== null) next.push(node.right);
      }
      queue = next;
    }
    return result;
  }
}`,
    input: { root: [1, 2, 3, null, 5, null, 4] },
    expected: [1, 3, 4],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [1] },
      { label: "Left only", input: { root: [1,2] }, expected: [1,2] },
      { label: "Classic", input: { root: [1,2,3,null,5,null,4] }, expected: [1,3,4] }
    ],
  },
  103: {
    no: 103,
    code: `class Solution {
  zigzagLevelOrder(root) {
    if (root === null) return [];
    const result = [];
    let queue = [root];
    let leftToRight = true;
    while (queue.length > 0) {
      const level = [];
      const next = [];
      for (const node of queue) {
        level.push(node.val);
        if (node.left !== null) next.push(node.left);
        if (node.right !== null) next.push(node.right);
      }
      if (!leftToRight) level.reverse();
      result.push(level);
      leftToRight = !leftToRight;
      queue = next;
    }
    return result;
  }
}`,
    input: { root: [3, 9, 20, null, null, 15, 7] },
    expected: [[3], [20, 9], [15, 7]],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [[1]] },
      { label: "Two levels", input: { root: [1,2,3,4,5] }, expected: [[1],[3,2],[4,5]] },
      { label: "Classic", input: { root: [3,9,20,null,null,15,7] }, expected: [[3],[20,9],[15,7]] }
    ],
  },
  98: {
    no: 98,
    code: `class Solution {
  isValidBST(root) {
    return this.check(root, -Infinity, Infinity);
  }
  check(node, low, high) {
    if (node === null) return true;
    if (node.val <= low || node.val >= high) return false;
    return this.check(node.left, low, node.val) && this.check(node.right, node.val, high);
  }
}`,
    input: { root: [2, 1, 3] },
    expected: true,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: true },
      { label: "Invalid", input: { root: [5,1,4,null,null,3,6] }, expected: false },
      { label: "Classic", input: { root: [2,1,3] }, expected: true }
    ],
  },
  530: {
    no: 530,
    code: `class Solution {
  getMinimumDifference(root) {
    let previous = null;
    let best = Infinity;
    const walk = (node) => {
      if (node === null) return;
      walk(node.left);
      if (previous !== null) best = Math.min(best, node.val - previous);
      previous = node.val;
      walk(node.right);
    };
    walk(root);
    return best;
  }
}`,
    input: { root: [4, 2, 6, 1, 3] },
    expected: 1,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: 0 },
      { label: "Wide", input: { root: [1,0,48,null,null,12,49] }, expected: 1 },
      { label: "Classic", input: { root: [4,2,6,1,3] }, expected: 1 }
    ],
  },
  230: {
    no: 230,
    code: `class Solution {
  kthSmallest(root, k) {
    let count = 0;
    let result = null;
    const walk = (node) => {
      if (node === null || result !== null) return;
      walk(node.left);
      count++;
      if (count === k) {
        result = node.val;
        return;
      }
      walk(node.right);
    };
    walk(root);
    return result;
  }
}`,
    input: { root: [3, 1, 4, null, 2], k: 1 },
    expected: 1,
    examples: [
      { label: "Edge: [1]", input: { root: [1], k: 1 }, expected: 1 },
      { label: "Right child", input: { root: [5,3,6,2,4,null,null,1], k: 3 }, expected: 3 },
      { label: "Classic", input: { root: [3,1,4,null,2], k: 1 }, expected: 1 }
    ],
  },
  236: {
    no: 236,
    code: `class Solution {
  lowestCommonAncestor(root, p, q) {
    return this.dfs(root, p, q);
  }
  dfs(node, p, q) {
    if (node === null) return null;
    if (node.val === p || node.val === q) return node;
    const left = this.dfs(node.left, p, q);
    const right = this.dfs(node.right, p, q);
    if (left !== null && right !== null) return node;
    return left !== null ? left : right;
  }
}`,
    input: { root: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 1 },
    expected: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4],
    examples: [
      { label: "Edge: [1]", input: { root: [1], p: 1, q: 1 }, expected: 1 },
      { label: "Both in left", input: { root: [3,5,1,6,2,0,8,null,null,7,4], p: 5, q: 4 }, expected: 5 },
      { label: "Classic", input: { root: [3,5,1,6,2,0,8,null,null,7,4], p: 5, q: 1 }, expected: 3 }
    ],
  },
  114: {
    no: 114,
    code: `class Solution {
  flatten(root) {
    let current = root;
    while (current !== null) {
      if (current.left !== null) {
        let predecessor = current.left;
        while (predecessor.right !== null) predecessor = predecessor.right;
        predecessor.right = current.right;
        current.right = current.left;
        current.left = null;
      }
      current = current.right;
    }
  }
}`,
    input: { root: [1, 2, 5, 3, 4, null, 6] },
    expected: [1, null, 2, null, 3, null, 4, null, 5, null, 6],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [1] },
      { label: "Left only", input: { root: [1,2] }, expected: [1,null,2] },
      { label: "Classic", input: { root: [1,2,5,3,4,null,6] }, expected: [1,null,2,null,3,null,4,null,5,null,6] }
    ],
  },
  105: {
    no: 105,
    code: `class Solution {
  buildTree(preorder, inorder) {
    if (preorder.length === 0) return null;
    const rootVal = preorder[0];
    const root = new TreeNode(rootVal);
    const mid = inorder.indexOf(rootVal);
    root.left = this.buildTree(preorder.slice(1, mid + 1), inorder.slice(0, mid));
    root.right = this.buildTree(preorder.slice(mid + 1), inorder.slice(mid + 1));
    return root;
  }
}`,
    input: { preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7] },
    expected: [3, 9, 20, null, null, 15, 7],
    examples: [
      { label: "Edge: [1]", input: { preorder: [1], inorder: [1] }, expected: [1] },
      { label: "Left only", input: { preorder: [1,2,3], inorder: [3,2,1] }, expected: [1,2,null,null,3] },
      { label: "Classic", input: { preorder: [3,9,20,15,7], inorder: [9,3,15,20,7] }, expected: [3,9,20,null,null,15,7] }
    ],
  },
  106: {
    no: 106,
    code: `class Solution {
  buildTree(inorder, postorder) {
    if (postorder.length === 0) return null;
    const rootVal = postorder[postorder.length - 1];
    const root = new TreeNode(rootVal);
    const mid = inorder.indexOf(rootVal);
    root.left = this.buildTree(inorder.slice(0, mid), postorder.slice(0, mid));
    root.right = this.buildTree(inorder.slice(mid + 1), postorder.slice(mid, postorder.length - 1));
    return root;
  }
}`,
    input: { inorder: [9, 3, 15, 20, 7], postorder: [9, 15, 7, 20, 3] },
    expected: [3, 9, 20, null, null, 15, 7],
    examples: [
      { label: "Edge: [1]", input: { inorder: [1], postorder: [1] }, expected: [1] },
      { label: "Right only", input: { inorder: [1,2,3], postorder: [3,2,1] }, expected: [1,null,2,null,3] },
      { label: "Classic", input: { inorder: [9,3,15,20,7], postorder: [9,15,7,20,3] }, expected: [3,9,20,null,null,15,7] }
    ],
  },
  222: {
    no: 222,
    code: `class Solution {
  countNodes(root) {
    if (root === null) return 0;
    const height = (node) => {
      let h = 0;
      while (node !== null) {
        h++;
        node = node.left;
      }
      return h;
    };
    const left = height(root.left);
    const right = height(root.right);
    if (left === right) return (1 << left) + this.countNodes(root.right);
    return (1 << right) + this.countNodes(root.left);
  }
}`,
    input: { root: [1, 2, 3, 4, 5, 6] },
    expected: 6,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: 1 },
      { label: "Full", input: { root: [1,2,3,4,5,6,7] }, expected: 7 },
      { label: "Classic", input: { root: [1,2,3,4,5,6] }, expected: 6 }
    ],
  },

  // ── Graphs ───────────────────────────────────────────────────────────────
  200: {
    no: 200,
    code: `class Solution {
  numIslands(grid) {
    let islands = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c] === "1") {
          islands++;
          this.sink(grid, r, c);
        }
      }
    }
    return islands;
  }
  sink(grid, r, c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] !== "1") return;
    grid[r][c] = "0";
    this.sink(grid, r + 1, c);
    this.sink(grid, r - 1, c);
    this.sink(grid, r, c + 1);
    this.sink(grid, r, c - 1);
  }
}`,
    input: { grid: [["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]] },
    expected: 1,
    examples: [
      { label: "Edge: [[0]]", input: { grid: [["0"]] }, expected: 0 },
      { label: "Multiple", input: { grid: [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]] }, expected: 3 },
      { label: "Classic", input: { grid: [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]] }, expected: 1 }
    ],
  },
  130: {
    no: 130,
    code: `class Solution {
  solve(board) {
    const rows = board.length;
    const cols = board[0].length;
    const dfs = (r, c) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== "O") return;
      board[r][c] = "S";
      dfs(r + 1, c);
      dfs(r - 1, c);
      dfs(r, c + 1);
      dfs(r, c - 1);
    };
    for (let r = 0; r < rows; r++) {
      dfs(r, 0);
      dfs(r, cols - 1);
    }
    for (let c = 0; c < cols; c++) {
      dfs(0, c);
      dfs(rows - 1, c);
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === "S") board[r][c] = "O";
        else if (board[r][c] === "O") board[r][c] = "X";
      }
    }
  }
}`,
    input: { board: [["X", "X", "X", "X"], ["X", "O", "O", "X"], ["X", "X", "O", "X"], ["X", "O", "X", "X"]] },
    expected: [["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "X", "X", "X"], ["X", "O", "X", "X"]],
    examples: [
      { label: "Edge: [[\"O\"]]", input: { board: [["O"]] }, expected: [["O"]] },
      { label: "All X", input: { board: [["X","X"],["X","X"]] }, expected: [["X","X"],["X","X"]] },
      { label: "Classic", input: { board: [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]] }, expected: [["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]] }
    ],
  },
  207: {
    no: 207,
    code: `class Solution {
  canFinish(numCourses, prerequisites) {
    const graph = {};
    for (const [a, b] of prerequisites) {
      if (!graph[a]) graph[a] = [];
      graph[a].push(b);
    }
    const state = new Array(numCourses).fill(0);
    const dfs = (course) => {
      if (state[course] === 1) return false;
      if (state[course] === 2) return true;
      state[course] = 1;
      for (const next of graph[course] ?? []) {
        if (!dfs(next)) return false;
      }
      state[course] = 2;
      return true;
    };
    for (let i = 0; i < numCourses; i++) {
      if (!dfs(i)) return false;
    }
    return true;
  }
}`,
    input: { numCourses: 2, prerequisites: [[1, 0]] },
    expected: true,
    examples: [
      { label: "Edge: 1", input: { numCourses: 1, prerequisites: [] }, expected: true },
      { label: "Cycle", input: { numCourses: 2, prerequisites: [[1,0],[0,1]] }, expected: false },
      { label: "Classic", input: { numCourses: 2, prerequisites: [[1,0]] }, expected: true }
    ],
  },
  210: {
    no: 210,
    code: `class Solution {
  findOrder(numCourses, prerequisites) {
    const graph = {};
    const indegree = new Array(numCourses).fill(0);
    for (const [course, prereq] of prerequisites) {
      if (!graph[prereq]) graph[prereq] = [];
      graph[prereq].push(course);
      indegree[course]++;
    }
    const queue = [];
    for (let i = 0; i < numCourses; i++) {
      if (indegree[i] === 0) queue.push(i);
    }
    const order = [];
    while (queue.length > 0) {
      const course = queue.shift();
      order.push(course);
      for (const next of graph[course] ?? []) {
        indegree[next]--;
        if (indegree[next] === 0) queue.push(next);
      }
    }
    return order.length === numCourses ? order : [];
  }
}`,
    input: { numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1], [3, 2]] },
    expected: [0, 1, 2, 3],
    examples: [
      { label: "Edge: 1", input: { numCourses: 1, prerequisites: [] }, expected: [0] },
      { label: "Cycle", input: { numCourses: 2, prerequisites: [[1,0],[0,1]] }, expected: [] },
      { label: "Classic", input: { numCourses: 4, prerequisites: [[1,0],[2,0],[3,1],[3,2]] }, expected: [0,1,2,3] }
    ],
  },

  // ── Backtracking ─────────────────────────────────────────────────────────
  17: {
    no: 17,
    code: `class Solution {
  letterCombinations(digits) {
    if (digits === "") return [];
    const map = { "2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz" };
    const result = [];
    const backtrack = (index, current) => {
      if (index === digits.length) {
        result.push(current);
        return;
      }
      for (const letter of map[digits[index]]) {
        backtrack(index + 1, current + letter);
      }
    };
    backtrack(0, "");
    return result;
  }
}`,
    input: { digits: "23" },
    expected: ["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"],
    examples: [
      { label: "Edge: \"\"", input: { digits: "" }, expected: [] },
      { label: "Typical", input: { digits: "23" }, expected: ["ad","ae","af","bd","be","bf","cd","ce","cf"] },
      { label: "Single", input: { digits: "2" }, expected: ["a","b","c"] }
    ],
  },
  77: {
    no: 77,
    code: `class Solution {
  combine(n, k) {
    const result = [];
    const backtrack = (start, current) => {
      if (current.length === k) {
        result.push([...current]);
        return;
      }
      for (let i = start; i <= n; i++) {
        current.push(i);
        backtrack(i + 1, current);
        current.pop();
      }
    };
    backtrack(1, []);
    return result;
  }
}`,
    input: { n: 4, k: 2 },
    expected: [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]],
    examples: [
      { label: "Edge: n=1,k=1", input: { n: 1, k: 1 }, expected: [[1]] },
      { label: "k=1", input: { n: 4, k: 1 }, expected: [[1],[2],[3],[4]] },
      { label: "Classic", input: { n: 4, k: 2 }, expected: [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]] }
    ],
  },
  46: {
    no: 46,
    code: `class Solution {
  permute(nums) {
    const result = [];
    const backtrack = (current, remaining) => {
      if (remaining.length === 0) {
        result.push([...current]);
        return;
      }
      for (let i = 0; i < remaining.length; i++) {
        const next = remaining[i];
        current.push(next);
        backtrack(current, remaining.slice(0, i).concat(remaining.slice(i + 1)));
        current.pop();
      }
    };
    backtrack([], nums);
    return result;
  }
}`,
    input: { nums: [1, 2, 3] },
    expected: [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]],
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: [[1]] },
      { label: "Pair", input: { nums: [0,1] }, expected: [[0,1],[1,0]] },
      { label: "Classic", input: { nums: [1,2,3] }, expected: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]] }
    ],
  },
  39: {
    no: 39,
    code: `class Solution {
  combinationSum(candidates, target) {
    const result = [];
    const backtrack = (start, current, sum) => {
      if (sum === target) {
        result.push([...current]);
        return;
      }
      if (sum > target) return;
      for (let i = start; i < candidates.length; i++) {
        current.push(candidates[i]);
        backtrack(i, current, sum + candidates[i]);
        current.pop();
      }
    };
    backtrack(0, [], 0);
    return result;
  }
}`,
    input: { candidates: [2, 3, 6, 7], target: 7 },
    expected: [[2, 2, 3], [7]],
    examples: [
      { label: "Edge: [2],t=1", input: { candidates: [2], target: 1 }, expected: [] },
      { label: "Typical", input: { candidates: [2,3,6,7], target: 7 }, expected: [[2,2,3],[7]] },
      { label: "All same", input: { candidates: [3], target: 9 }, expected: [[3,3,3]] }
    ],
  },
  22: {
    no: 22,
    code: `class Solution {
  generateParenthesis(n) {
    const result = [];
    const backtrack = (current, open, close) => {
      if (current.length === n * 2) {
        result.push(current);
        return;
      }
      if (open < n) backtrack(current + "(", open + 1, close);
      if (close < open) backtrack(current + ")", open, close + 1);
    };
    backtrack("", 0, 0);
    return result;
  }
}`,
    input: { n: 3 },
    expected: ["((()))", "(()())", "(())()", "()(())", "()()()"],
    examples: [
      { label: "Edge: 1", input: { n: 1 }, expected: ["()"] },
      { label: "n=2", input: { n: 2 }, expected: ["(())","()()"] },
      { label: "Classic", input: { n: 3 }, expected: ["((()))","(()())","(())()","()(())","()()()"] }
    ],
  },
  79: {
    no: 79,
    code: `class Solution {
  exist(board, word) {
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        if (this.search(board, word, r, c, 0)) return true;
      }
    }
    return false;
  }
  search(board, word, r, c, index) {
    if (index === word.length) return true;
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
    if (board[r][c] !== word[index]) return false;
    const temp = board[r][c];
    board[r][c] = "#";
    const found =
      this.search(board, word, r + 1, c, index + 1) ||
      this.search(board, word, r - 1, c, index + 1) ||
      this.search(board, word, r, c + 1, index + 1) ||
      this.search(board, word, r, c - 1, index + 1);
    board[r][c] = temp;
    return found;
  }
}`,
    input: { board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "ABCCED" },
    expected: true,
    examples: [
      { label: "Edge: no match", input: { board: [["a"]], word: "b" }, expected: false },
      { label: "Full path", input: { board: [["a","b"],["c","d"]], word: "abcd" }, expected: false },
      { label: "Classic", input: { board: [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word: "ABCCED" }, expected: true }
    ],
  },

  // ── Divide & Conquer ─────────────────────────────────────────────────────
  108: {
    no: 108,
    code: `class Solution {
  sortedArrayToBST(nums) {
    if (nums.length === 0) return null;
    const mid = Math.floor(nums.length / 2);
    const root = new TreeNode(nums[mid]);
    root.left = this.sortedArrayToBST(nums.slice(0, mid));
    root.right = this.sortedArrayToBST(nums.slice(mid + 1));
    return root;
  }
}`,
    input: { nums: [-10, -3, 0, 5, 9] },
    expected: [0, -3, 9, -10, null, 5],
    examples: [
      { label: "Edge: [0]", input: { nums: [0] }, expected: [0] },
      { label: "Pair", input: { nums: [1,3] }, expected: [3,1] },
      { label: "Classic", input: { nums: [-10,-3,0,5,9] }, expected: [0,-3,9,-10,null,5] }
    ],
  },

  // ── Kadane's Algorithm ───────────────────────────────────────────────────
  53: {
    no: 53,
    code: `class Solution {
  maxSubArray(nums) {
    let best = nums[0];
    let current = 0;
    for (const num of nums) {
      current = Math.max(num, current + num);
      best = Math.max(best, current);
    }
    return best;
  }
}`,
    input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
    expected: 6,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 1 },
      { label: "All neg", input: { nums: [-1,-2,-3] }, expected: -1 },
      { label: "Classic", input: { nums: [-2,1,-3,4,-1,2,1,-5,4] }, expected: 6 }
    ],
  },
  918: {
    no: 918,
    code: `class Solution {
  maxSubarraySumCircular(nums) {
    let maxEnd = nums[0];
    let minEnd = nums[0];
    let maxSum = nums[0];
    let minSum = nums[0];
    let total = nums[0];
    for (let i = 1; i < nums.length; i++) {
      const num = nums[i];
      maxEnd = Math.max(num, maxEnd + num);
      maxSum = Math.max(maxSum, maxEnd);
      minEnd = Math.min(num, minEnd + num);
      minSum = Math.min(minSum, minEnd);
      total += num;
    }
    return maxSum > 0 ? Math.max(maxSum, total - minSum) : maxSum;
  }
}`,
    input: { nums: [1, -2, 3, -2] },
    expected: 3,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 1 },
      { label: "All neg", input: { nums: [-3,-2,-3] }, expected: -2 },
      { label: "Classic", input: { nums: [1,-2,3,-2] }, expected: 3 }
    ],
  },

  // ── Binary Search ────────────────────────────────────────────────────────
  35: {
    no: 35,
    code: `class Solution {
  searchInsert(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] === target) return mid;
      if (nums[mid] < target) left = mid + 1;
      else right = mid - 1;
    }
    return left;
  }
}`,
    input: { nums: [1, 3, 5, 6], target: 5 },
    expected: 2,
    examples: [
      { label: "Edge: [1]", input: { nums: [1], target: 0 }, expected: 0 },
      { label: "Typical", input: { nums: [1,3,5,6], target: 5 }, expected: 2 },
      { label: "Beyond", input: { nums: [1,3,5,6], target: 7 }, expected: 4 }
    ],
  },
  74: {
    no: 74,
    code: `class Solution {
  searchMatrix(matrix, target) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    let left = 0;
    let right = rows * cols - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const value = matrix[Math.floor(mid / cols)][mid % cols];
      if (value === target) return true;
      if (value < target) left = mid + 1;
      else right = mid - 1;
    }
    return false;
  }
}`,
    input: { matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 3 },
    expected: true,
    examples: [
      { label: "Edge: [[1]],target=1", input: { matrix: [[1]], target: 1 }, expected: true },
      { label: "Not found", input: { matrix: [[1,3,5,7],[10,11,16,20]], target: 13 }, expected: false },
      { label: "Classic", input: { matrix: [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target: 3 }, expected: true }
    ],
  },
  162: {
    no: 162,
    code: `class Solution {
  findPeakElement(nums) {
    let left = 0;
    let right = nums.length - 1;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] > nums[mid + 1]) right = mid;
      else left = mid + 1;
    }
    return left;
  }
}`,
    input: { nums: [1, 2, 3, 1] },
    expected: 2,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 0 },
      { label: "Rising", input: { nums: [1,2,1,3,5,6,4] }, expected: 5 },
      { label: "Classic", input: { nums: [1,2,3,1] }, expected: 2 }
    ],
  },
  33: {
    no: 33,
    code: `class Solution {
  search(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] === target) return mid;
      if (nums[left] <= nums[mid]) {
        if (target >= nums[left] && target < nums[mid]) right = mid - 1;
        else left = mid + 1;
      } else {
        if (target > nums[mid] && target <= nums[right]) left = mid + 1;
        else right = mid - 1;
      }
    }
    return -1;
  }
}`,
    input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 },
    expected: 4,
    examples: [
      { label: "Edge: [1]", input: { nums: [1], target: 0 }, expected: -1 },
      { label: "Typical", input: { nums: [4,5,6,7,0,1,2], target: 0 }, expected: 4 },
      { label: "Not found", input: { nums: [4,5,6,7,0,1,2], target: 3 }, expected: -1 }
    ],
  },
  34: {
    no: 34,
    code: `class Solution {
  searchRange(nums, target) {
    return [this.first(nums, target), this.last(nums, target)];
  }
  first(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    let result = -1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] >= target) {
        if (nums[mid] === target) result = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    return result;
  }
  last(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    let result = -1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] <= target) {
        if (nums[mid] === target) result = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return result;
  }
}`,
    input: { nums: [5, 7, 7, 8, 8, 10], target: 8 },
    expected: [3, 4],
    examples: [
      { label: "Edge: [1]", input: { nums: [1], target: 1 }, expected: [0,0] },
      { label: "Typical", input: { nums: [5,7,7,8,8,10], target: 8 }, expected: [3,4] },
      { label: "Not found", input: { nums: [5,7,7,8,8,10], target: 6 }, expected: [-1,-1] }
    ],
  },
  153: {
    no: 153,
    code: `class Solution {
  findMin(nums) {
    let left = 0;
    let right = nums.length - 1;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] > nums[right]) left = mid + 1;
      else right = mid;
    }
    return nums[left];
  }
}`,
    input: { nums: [3, 4, 5, 1, 2] },
    expected: 1,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 1 },
      { label: "Not rotated", input: { nums: [1,2,3,4,5] }, expected: 1 },
      { label: "Classic", input: { nums: [3,4,5,1,2] }, expected: 1 }
    ],
  },
  4: {
    no: 4,
    code: `class Solution {
  findMedianSortedArrays(nums1, nums2) {
    let a = nums1;
    let b = nums2;
    if (a.length > b.length) {
      const temp = a;
      a = b;
      b = temp;
    }
    const total = a.length + b.length;
    const half = Math.floor((total + 1) / 2);
    let left = 0;
    let right = a.length;
    while (left <= right) {
      const i = Math.floor((left + right) / 2);
      const j = half - i;
      const aLeft = i > 0 ? a[i - 1] : -Infinity;
      const aRight = i < a.length ? a[i] : Infinity;
      const bLeft = j > 0 ? b[j - 1] : -Infinity;
      const bRight = j < b.length ? b[j] : Infinity;
      if (aLeft <= bRight && bLeft <= aRight) {
        if (total % 2 === 1) return Math.max(aLeft, bLeft);
        return (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2;
      }
      if (aLeft > bRight) right = i - 1;
      else left = i + 1;
    }
    return 0;
  }
}`,
    input: { nums1: [1, 3], nums2: [2] },
    expected: 2,
    examples: [
      { label: "Edge: \"a\"", input: { s: "a", numRows: 1 }, expected: "a" },
      { label: "n=2", input: { s: "PAYPALISHIRING", numRows: 2 }, expected: "PYAIHLSNIGIR" },
      { label: "Classic", input: { s: "PAYPALISHIRING", numRows: 3 }, expected: "PAHNAPLSIIGYIR" }
    ],
  },

  // ── Heap ─────────────────────────────────────────────────────────────────
  215: {
    no: 215,
    code: `class Solution {
  findKthLargest(nums, k) {
    nums.sort((a, b) => b - a);
    return nums[k - 1];
  }
}`,
    input: { nums: [3, 2, 1, 5, 6, 4], k: 2 },
    expected: 5,
    examples: [
      { label: "Edge: [3,2,1]", input: { nums: [3,2,1], k: 1 }, expected: 3 },
      { label: "All same", input: { nums: [1,1,1], k: 2 }, expected: 1 },
      { label: "Classic", input: { nums: [3,2,3,1,2,4,5,5,6], k: 4 }, expected: 4 }
    ],
  },

  // ── Bit Manipulation ─────────────────────────────────────────────────────
  67: {
    no: 67,
    code: `class Solution {
  addBinary(a, b) {
    let i = a.length - 1;
    let j = b.length - 1;
    let carry = 0;
    let result = "";
    while (i >= 0 || j >= 0 || carry > 0) {
      const sum = (i >= 0 ? Number(a[i]) : 0) + (j >= 0 ? Number(b[j]) : 0) + carry;
      result = (sum % 2) + result;
      carry = Math.floor(sum / 2);
      i--;
      j--;
    }
    return result;
  }
}`,
    input: { a: "11", b: "1" },
    expected: "100",
    examples: [
      { label: "Edge: \"0\"", input: { a: "0", b: "0" }, expected: "0" },
      { label: "Both long", input: { a: "1010", b: "1011" }, expected: "10101" },
      { label: "Classic", input: { a: "11", b: "1" }, expected: "100" }
    ],
  },
  190: {
    no: 190,
    code: `class Solution {
  reverseBits(n) {
    let result = 0;
    for (let i = 0; i < 32; i++) {
      result = result * 2 + (n & 1);
      n = n >>> 1;
    }
    return result >>> 0;
  }
}`,
    input: { n: 43261596 },
    expected: 964176192,
    examples: [
      { label: "Edge: 0", input: { n: 0 }, expected: 0 },
      { label: "All 1s", input: { n: 4294967293 }, expected: 3221225471 },
      { label: "Classic", input: { n: 43261596 }, expected: 964176192 }
    ],
  },
  191: {
    no: 191,
    code: `class Solution {
  hammingWeight(n) {
    let count = 0;
    while (n !== 0) {
      n = n & (n - 1);
      count++;
    }
    return count;
  }
}`,
    input: { n: 11 },
    expected: 3,
    examples: [
      { label: "Edge: 0", input: { n: 0 }, expected: 0 },
      { label: "All 1s", input: { n: 4294967293 }, expected: 31 },
      { label: "Classic", input: { n: 11 }, expected: 3 }
    ],
  },
  136: {
    no: 136,
    code: `class Solution {
  singleNumber(nums) {
    let result = 0;
    for (const num of nums) result ^= num;
    return result;
  }
}`,
    input: { nums: [4, 1, 2, 1, 2] },
    expected: 4,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 1 },
      { label: "Negatives", input: { nums: [-1,1,-2,2,3] }, expected: 3 },
      { label: "Classic", input: { nums: [4,1,2,1,2] }, expected: 4 }
    ],
  },
  137: {
    no: 137,
    code: `class Solution {
  singleNumber(nums) {
    let ones = 0;
    let twos = 0;
    for (const num of nums) {
      ones = (ones ^ num) & ~twos;
      twos = (twos ^ num) & ~ones;
    }
    return ones;
  }
}`,
    input: { nums: [2, 2, 3, 2] },
    expected: 3,
    examples: [
      { label: "Edge: [1,1,1,2]", input: { nums: [1,1,1,2] }, expected: 2 },
      { label: "Neg", input: { nums: [-2,-2,1,-2] }, expected: 1 },
      { label: "Classic", input: { nums: [0,1,0,1,0,1,99] }, expected: 99 }
    ],
  },
  201: {
    no: 201,
    code: `class Solution {
  rangeBitwiseAnd(left, right) {
    let shift = 0;
    while (left < right) {
      left = left >> 1;
      right = right >> 1;
      shift++;
    }
    return left << shift;
  }
}`,
    input: { left: 5, right: 7 },
    expected: 4,
    examples: [
      { label: "Edge: 0", input: { left: 0, right: 0 }, expected: 0 },
      { label: "Same", input: { left: 3, right: 3 }, expected: 3 },
      { label: "Classic", input: { left: 5, right: 7 }, expected: 4 }
    ],
  },

  // ── Math ─────────────────────────────────────────────────────────────────
  9: {
    no: 9,
    code: `class Solution {
  isPalindrome(x) {
    if (x < 0) return false;
    let original = x;
    let reversed = 0;
    while (original > 0) {
      reversed = reversed * 10 + (original % 10);
      original = Math.floor(original / 10);
    }
    return reversed === x;
  }
}`,
    input: { x: 121 },
    expected: true,
    examples: [
      { label: "Edge: 0", input: { x: 0 }, expected: true },
      { label: "Negative", input: { x: -121 }, expected: false },
      { label: "Classic", input: { x: 121 }, expected: true }
    ],
  },
  66: {
    no: 66,
    code: `class Solution {
  plusOne(digits) {
    for (let i = digits.length - 1; i >= 0; i--) {
      if (digits[i] < 9) {
        digits[i]++;
        return digits;
      }
      digits[i] = 0;
    }
    return [1, ...digits];
  }
}`,
    input: { digits: [1, 2, 3] },
    expected: [1, 2, 4],
    examples: [
      { label: "Edge: [9]", input: { digits: [9] }, expected: [1,0] },
      { label: "All 9s", input: { digits: [9,9,9] }, expected: [1,0,0,0] },
      { label: "Classic", input: { digits: [1,2,3] }, expected: [1,2,4] }
    ],
  },
  172: {
    no: 172,
    code: `class Solution {
  trailingZeroes(n) {
    let count = 0;
    while (n >= 5) {
      n = Math.floor(n / 5);
      count += n;
    }
    return count;
  }
}`,
    input: { n: 25 },
    expected: 6,
    examples: [
      { label: "Edge: 0", input: { n: 0 }, expected: 0 },
      { label: "Large", input: { n: 30 }, expected: 7 },
      { label: "Classic", input: { n: 5 }, expected: 1 }
    ],
  },
  69: {
    no: 69,
    code: `class Solution {
  mySqrt(x) {
    let left = 0;
    let right = x;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const square = mid * mid;
      if (square === x) return mid;
      if (square < x) left = mid + 1;
      else right = mid - 1;
    }
    return right;
  }
}`,
    input: { x: 8 },
    expected: 2,
    examples: [
      { label: "Edge: 0", input: { x: 0 }, expected: 0 },
      { label: "Not perfect", input: { x: 8 }, expected: 2 },
      { label: "Classic", input: { x: 4 }, expected: 2 }
    ],
  },
  50: {
    no: 50,
    code: `class Solution {
  myPow(x, n) {
    if (n === 0) return 1;
    if (n < 0) return 1 / this.myPow(x, -n);
    const half = this.myPow(x, Math.floor(n / 2));
    return n % 2 === 0 ? half * half : half * half * x;
  }
}`,
    input: { x: 2, n: 10 },
    expected: 1024,
    examples: [
      { label: "Edge: 0^0", input: { x: 0, n: 0 }, expected: 1 },
      { label: "Negative", input: { x: 2.00000, n: -2 }, expected: 0.25 },
      { label: "Classic", input: { x: 2.00000, n: 10 }, expected: 1024.0 }
    ],
  },

  // ── 1D DP ────────────────────────────────────────────────────────────────
  70: {
    no: 70,
    code: `class Solution {
  climbStairs(n) {
    if (n <= 2) return n;
    let prev = 1;
    let current = 2;
    for (let i = 3; i <= n; i++) {
      const next = prev + current;
      prev = current;
      current = next;
    }
    return current;
  }
}`,
    input: { n: 5 },
    expected: 8,
    examples: [
      { label: "Edge: 1", input: { n: 1 }, expected: 1 },
      { label: "n=5", input: { n: 5 }, expected: 8 },
      { label: "Classic", input: { n: 2 }, expected: 2 }
    ],
  },
  198: {
    no: 198,
    code: `class Solution {
  rob(nums) {
    let prev = 0;
    let current = 0;
    for (const num of nums) {
      const next = Math.max(current, prev + num);
      prev = current;
      current = next;
    }
    return current;
  }
}`,
    input: { nums: [2, 7, 9, 3, 1] },
    expected: 12,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 1 },
      { label: "All neg", input: { nums: [2,1,1,2] }, expected: 4 },
      { label: "Classic", input: { nums: [1,2,3,1] }, expected: 4 }
    ],
  },
  139: {
    no: 139,
    code: `class Solution {
  wordBreak(s, wordDict) {
    const dp = new Array(s.length + 1).fill(false);
    dp[0] = true;
    for (let i = 1; i <= s.length; i++) {
      for (const word of wordDict) {
        if (i >= word.length && dp[i - word.length] && s.slice(i - word.length, i) === word) {
          dp[i] = true;
          break;
        }
      }
    }
    return dp[s.length];
  }
}`,
    input: { s: "leetcode", wordDict: ["leet", "code"] },
    expected: true,
    examples: [
      { label: "Edge: \"\"", input: { s: "", wordDict: ["a"] }, expected: true },
      { label: "Not possible", input: { s: "catsandog", wordDict: ["cats","dog","sand","and","cat"] }, expected: false },
      { label: "Classic", input: { s: "leetcode", wordDict: ["leet","code"] }, expected: true }
    ],
  },
  322: {
    no: 322,
    code: `class Solution {
  coinChange(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= amount; i++) {
      for (const coin of coins) {
        if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
  }
}`,
    input: { coins: [1, 2, 5], amount: 11 },
    expected: 3,
    examples: [
      { label: "Edge: amount=0", input: { coins: [1], amount: 0 }, expected: 0 },
      { label: "Impossible", input: { coins: [2], amount: 3 }, expected: -1 },
      { label: "Classic", input: { coins: [1,5,10,25], amount: 30 }, expected: 2 }
    ],
  },
  300: {
    no: 300,
    code: `class Solution {
  lengthOfLIS(nums) {
    const tails = [];
    for (const num of nums) {
      let left = 0;
      let right = tails.length;
      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (tails[mid] < num) left = mid + 1;
        else right = mid;
      }
      if (left === tails.length) tails.push(num);
      else tails[left] = num;
    }
    return tails.length;
  }
}`,
    input: { nums: [10, 9, 2, 5, 3, 7, 101, 18] },
    expected: 4,
    examples: [
      { label: "Edge: [0]", input: { nums: [0] }, expected: 1 },
      { label: "All same", input: { nums: [1,1,1,1] }, expected: 1 },
      { label: "Classic", input: { nums: [10,9,2,5,3,7,101,18] }, expected: 4 }
    ],
  },

  // ── Multidimensional DP ──────────────────────────────────────────────────
  120: {
    no: 120,
    code: `class Solution {
  minimumTotal(triangle) {
    const dp = triangle[triangle.length - 1].slice();
    for (let row = triangle.length - 2; row >= 0; row--) {
      for (let col = 0; col < triangle[row].length; col++) {
        dp[col] = triangle[row][col] + Math.min(dp[col], dp[col + 1]);
      }
    }
    return dp[0];
  }
}`,
    input: { triangle: [[2], [3, 4], [6, 5, 7], [4, 1, 8, 3]] },
    expected: 11,
    examples: [
      { label: "Edge: [[-10]]", input: { triangle: [[-10]] }, expected: -10 },
      { label: "Two rows", input: { triangle: [[-1],[2,3],[-1]] }, expected: -1 },
      { label: "Classic", input: { triangle: [[2],[3,4],[6,5,7],[4,1,8,3]] }, expected: 11 }
    ],
  },
  64: {
    no: 64,
    code: `class Solution {
  minPathSum(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue;
        if (r === 0) grid[r][c] += grid[r][c - 1];
        else if (c === 0) grid[r][c] += grid[r - 1][c];
        else grid[r][c] += Math.min(grid[r - 1][c], grid[r][c - 1]);
      }
    }
    return grid[rows - 1][cols - 1];
  }
}`,
    input: { grid: [[1, 3, 1], [1, 5, 1], [4, 2, 1]] },
    expected: 7,
    examples: [
      { label: "Edge: [[1]]", input: { grid: [[1]] }, expected: 1 },
      { label: "2x2", input: { grid: [[1,2],[1,1]] }, expected: 3 },
      { label: "Classic", input: { grid: [[1,3,1],[1,5,1],[4,2,1]] }, expected: 7 }
    ],
  },
  63: {
    no: 63,
    code: `class Solution {
  uniquePathsWithObstacles(obstacleGrid) {
    const rows = obstacleGrid.length;
    const cols = obstacleGrid[0].length;
    const dp = new Array(rows).fill(0).map(() => new Array(cols).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (obstacleGrid[r][c] === 1) {
          dp[r][c] = 0;
        } else if (r === 0 && c === 0) {
          dp[r][c] = 1;
        } else {
          dp[r][c] = (r > 0 ? dp[r - 1][c] : 0) + (c > 0 ? dp[r][c - 1] : 0);
        }
      }
    }
    return dp[rows - 1][cols - 1];
  }
}`,
    input: { obstacleGrid: [[0, 0, 0], [0, 1, 0], [0, 0, 0]] },
    expected: 2,
    examples: [
      { label: "Edge: [[1]]", input: { obstacleGrid: [[1]] }, expected: 0 },
      { label: "No obstacles", input: { obstacleGrid: [[0,0],[0,0]] }, expected: 6 },
      { label: "Classic", input: { obstacleGrid: [[0,0,0],[0,1,0],[0,0,0]] }, expected: 2 }
    ],
  },
  5: {
    no: 5,
    code: `class Solution {
  longestPalindrome(s) {
    let best = "";
    for (let i = 0; i < s.length; i++) {
      const odd = this.expand(s, i, i);
      const even = this.expand(s, i, i + 1);
      if (odd.length > best.length) best = odd;
      if (even.length > best.length) best = even;
    }
    return best;
  }
  expand(s, left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    return s.slice(left + 1, right);
  }
}`,
    input: { s: "babad" },
    expected: "bab",
    bruteCode: `class Solution {
  longestPalindrome(s) {
    let best = "";
    for (let i = 0; i < s.length; i++) {
      for (let j = i; j < s.length; j++) {
        const sub = s.slice(i, j + 1);
        if (sub === sub.split("").reverse().join("") && sub.length > best.length) {
          best = sub;
        }
      }
    }
    return best;
  }
}`,
    examples: [
      { label: "Edge: \"a\"", input: { s: "a" }, expected: "a" },
      { label: "Even length", input: { s: "cbbd" }, expected: "bb" },
      { label: "Classic", input: { s: "babad" }, expected: "bab" }
    ],
  },
  72: {
    no: 72,
    code: `class Solution {
  minDistance(word1, word2) {
    const rows = word1.length;
    const cols = word2.length;
    const dp = new Array(rows + 1).fill(0).map(() => new Array(cols + 1).fill(0));
    for (let c = 0; c <= cols; c++) dp[0][c] = c;
    for (let r = 0; r <= rows; r++) dp[r][0] = r;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        if (word1[r - 1] === word2[c - 1]) dp[r][c] = dp[r - 1][c - 1];
        else dp[r][c] = 1 + Math.min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]);
      }
    }
    return dp[rows][cols];
  }
}`,
    input: { word1: "horse", word2: "ros" },
    expected: 3,
    examples: [
      { label: "Edge: \"\"", input: { word1: "", word2: "" }, expected: 0 },
      { label: "Same", input: { word1: "abc", word2: "abc" }, expected: 0 },
      { label: "Classic", input: { word1: "horse", word2: "ros" }, expected: 3 }
    ],
  },
  221: {
    no: 221,
    code: `class Solution {
  maximalSquare(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const dp = new Array(rows).fill(0).map(() => new Array(cols).fill(0));
    let best = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === "1") {
          if (r === 0 || c === 0) dp[r][c] = 1;
          else dp[r][c] = 1 + Math.min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]);
          best = Math.max(best, dp[r][c]);
        }
      }
    }
    return best * best;
  }
}`,
    input: { matrix: [["1", "0", "1", "0", "0"], ["1", "0", "1", "1", "1"], ["1", "1", "1", "1", "1"], ["1", "0", "0", "1", "0"]] },
    expected: 4,
    examples: [
      { label: "Edge: [[\"0\"]]", input: { matrix: [["0"]] }, expected: 0 },
      { label: "All 1s", input: { matrix: [["1","1"],["1","1"]] }, expected: 4 },
      { label: "Classic", input: { matrix: [["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]] }, expected: 4 }
    ],
  },

  // ── Linked List (wave 2) ────────────────────────────────────────────────
  141: {
    no: 141,
    code: `class Solution {
  hasCycle(head, pos) {
    if (head === null) return false;
    var nodes = [];
    var curr = head;
    while (curr !== null) { nodes.push(curr); curr = curr.next; }
    if (pos >= 0 && pos < nodes.length) nodes[nodes.length - 1].next = nodes[pos];
    var slow = head;
    var fast = head;
    var found = false;
    while (fast !== null && fast.next !== null) {
      slow = slow.next;
      fast = fast.next.next;
      if (slow === fast) { found = true; break; }
    }
    return found;
  }
}`,
    input: { head: [3, 2, 0, -4], pos: 1 },
    expected: true,
    examples: [
      { label: "Edge: [1]", input: { head: [1], pos: -1 }, expected: false },
      { label: "Cycle at start", input: { head: [1,2], pos: 0 }, expected: true },
      { label: "Classic", input: { head: [3,2,0,-4], pos: 1 }, expected: true }
    ],
  },
  25: {
    no: 25,
    code: `class Solution {
  reverseKGroup(head, k) {
    const dummy = new ListNode(0, head);
    let groupPrev = dummy;

    while (true) {
      let kth = groupPrev;
      for (let i = 0; i < k; i++) {
        kth = kth.next;
        if (kth === null) return dummy.next;
      }
      let groupNext = kth.next;
      let prev = groupNext;
      let curr = groupPrev.next;
      for (let i = 0; i < k; i++) {
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
      }
      const tmp = groupPrev.next;
      groupPrev.next = kth;
      groupPrev = tmp;
    }
  }
}`,
    input: { head: [1, 2, 3, 4, 5], k: 2 },
    expected: [2, 1, 4, 3, 5],
    examples: [
      { label: "Edge: [1],k=1", input: { head: [1], k: 1 }, expected: [1] },
      { label: "Typical", input: { head: [1,2,3,4,5], k: 2 }, expected: [2,1,4,3,5] },
      { label: "Exact", input: { head: [1,2,3], k: 3 }, expected: [3,2,1] }
    ],
  },
  23: {
    no: 23,
    code: `class Solution {
  mergeKLists(lists) {
    function toList(arr) {
      var dummy = new ListNode(0);
      var tail = dummy;
      for (var i = 0; i < arr.length; i++) { tail.next = new ListNode(arr[i]); tail = tail.next; }
      return dummy.next;
    }
    function merge(l1, l2) {
      var dummy = new ListNode(0);
      var tail = dummy;
      while (l1 !== null && l2 !== null) {
        if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
        else { tail.next = l2; l2 = l2.next; }
        tail = tail.next;
      }
      tail.next = l1 !== null ? l1 : l2;
      return dummy.next;
    }
    var result = null;
    for (var i = 0; i < lists.length; i++) {
      var head = toList(lists[i]);
      result = merge(result, head);
    }
    return result;
  }
}`,
    input: { lists: [[1, 4, 5], [1, 3, 4], [2, 6]] },
    expected: [1, 1, 2, 3, 4, 4, 5, 6],
    examples: [
      { label: "Edge: []", input: { lists: [] }, expected: [] },
      { label: "Typical", input: { lists: [[1,4,5],[1,3,4],[2,6]] }, expected: [1,1,2,3,4,4,5,6] },
      { label: "Single", input: { lists: [[1]] }, expected: [1] }
    ],
  },
  148: {
    no: 148,
    code: `class Solution {
  sortList(head) {
    if (head === null || head.next === null) return head;
    let slow = head;
    let fast = head.next;
    while (fast !== null && fast.next !== null) {
      slow = slow.next;
      fast = fast.next.next;
    }
    const mid = slow.next;
    slow.next = null;
    const left = this.sortList(head);
    const right = this.sortList(mid);
    return this.merge(left, right);
  }

  merge(l1, l2) {
    const dummy = new ListNode(0);
    let tail = dummy;
    while (l1 !== null && l2 !== null) {
      if (l1.val <= l2.val) {
        tail.next = l1;
        l1 = l1.next;
      } else {
        tail.next = l2;
        l2 = l2.next;
      }
      tail = tail.next;
    }
    tail.next = l1 !== null ? l1 : l2;
    return dummy.next;
  }
}`,
    input: { head: [4, 2, 1, 3] },
    expected: [1, 2, 3, 4],
    examples: [
      { label: "Edge: [1]", input: { head: [1] }, expected: [1] },
      { label: "All same", input: { head: [1,1,1] }, expected: [1,1,1] },
      { label: "Classic", input: { head: [4,2,1,3] }, expected: [1,2,3,4] }
    ],
  },

  // ── Graph / BFS (wave 2) ────────────────────────────────────────────────
  133: {
    no: 133,
    code: `class Node {
  constructor(val, neighbors) {
    this.val = val;
    this.neighbors = neighbors || [];
  }
}

class Solution {
  cloneGraph(node) {
    if (node === null) return null;
    const visited = new Map();
    const clone = (n) => {
      if (visited.has(n.val)) return visited.get(n.val);
      const copy = new Node(n.val);
      visited.set(n.val, copy);
      for (const neighbor of n.neighbors) {
        copy.neighbors.push(clone(neighbor));
      }
      return copy;
    };
    return clone(node);
  }
}`,
    input: { node: [[2, 4], [1, 3], [2, 4], [1, 3]] },
    expected: [[2, 4], [1, 3], [2, 4], [1, 3]],
    examples: [
      { label: "Edge: [[]]", input: { adjList: [[]] }, expected: [[]] },
      { label: "Single", input: { adjList: [[]] }, expected: [[]] },
      { label: "Classic", input: { adjList: [[2,4],[1,3],[2,4],[1,3]] }, expected: [[2,4],[1,3],[2,4],[1,3]] }
    ],
  },
  127: {
    no: 127,
    code: `class Solution {
  ladderLength(beginWord, endWord, wordList) {
    const wordSet = new Set(wordList);
    if (!wordSet.has(endWord)) return 0;
    let queue = [beginWord];
    let visited = new Set([beginWord]);
    let steps = 1;
    while (queue.length > 0) {
      const next = [];
      for (const word of queue) {
        for (let i = 0; i < word.length; i++) {
          for (let c = 97; c <= 122; c++) {
            const ch = String.fromCharCode(c);
            if (ch === word[i]) continue;
            const newWord = word.slice(0, i) + ch + word.slice(i + 1);
            if (newWord === endWord) return steps + 1;
            if (wordSet.has(newWord) && !visited.has(newWord)) {
              visited.add(newWord);
              next.push(newWord);
            }
          }
        }
      }
      queue = next;
      steps++;
    }
    return 0;
  }
}`,
    input: { beginWord: "hit", endWord: "cog", wordList: ["hot", "dot", "dog", "lot", "log", "cog"] },
    expected: 5,
    examples: [
      { label: "Edge: same", input: { beginWord: "hot", endWord: "hot", wordList: ["hot"] }, expected: 0 },
      { label: "No path", input: { beginWord: "hit", endWord: "cog", wordList: ["hot","dot","dog","lot","log"] }, expected: 0 },
      { label: "Classic", input: { beginWord: "hit", endWord: "cog", wordList: ["hot","dot","dog","lot","log","cog"] }, expected: 5 }
    ],
  },
  399: {
    no: 399,
    code: `class Solution {
  calcEquation(equations, values, queries) {
    const graph = new Map();
    for (let i = 0; i < equations.length; i++) {
      const [a, b] = equations[i];
      if (!graph.has(a)) graph.set(a, new Map());
      if (!graph.has(b)) graph.set(b, new Map());
      graph.get(a).set(b, values[i]);
      graph.get(b).set(a, 1 / values[i]);
    }

    const bfs = (start, end) => {
      if (!graph.has(start) || !graph.has(end)) return -1;
      if (start === end) return 1;
      const visited = new Set([start]);
      const queue = [[start, 1]];
      while (queue.length > 0) {
        const [node, weight] = queue.shift();
        for (const [neighbor, w] of graph.get(node)) {
          if (neighbor === end) return weight * w;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push([neighbor, weight * w]);
          }
        }
      }
      return -1;
    };

    return queries.map(([a, b]) => bfs(a, b));
  }
}`,
    input: { equations: [["a", "b"], ["b", "c"]], values: [2.0, 3.0], queries: [["a", "c"], ["b", "a"], ["a", "e"], ["a", "a"], ["x", "x"]] },
    expected: [6.0, 0.5, -1.0, 1.0, -1.0],
    examples: [
      { label: "Disconnected", input: { equations: [["a","b"]], values: [2.0], queries: [["a","c"]] }, expected: [-1.0] },
      { label: "Simple", input: { equations: [["a","b"]], values: [2.0], queries: [["a","b"],["b","a"]] }, expected: [2.0,0.5] },
      { label: "Classic", input: { equations: [["a","b"],["b","c"]], values: [2.0,3.0], queries: [["a","c"],["b","a"],["a","e"],["a","a"],["x","x"]] }, expected: [6.0,0.5,-1.0,1.0,1.0] }
    ],
  },

  // ── Tree (wave 2) ───────────────────────────────────────────────────────
  124: {
    no: 124,
    code: `class Solution {
  maxPathSum(root) {
    let best = -Infinity;
    const dfs = (node) => {
      if (node === null) return 0;
      const left = Math.max(dfs(node.left), 0);
      const right = Math.max(dfs(node.right), 0);
      best = Math.max(best, node.val + left + right);
      return node.val + Math.max(left, right);
    };
    dfs(root);
    return best;
  }
}`,
    input: { root: [1, 2, 3] },
    expected: 6,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: 1 },
      { label: "Negatives", input: { root: [-10,9,20,null,null,15,7] }, expected: 42 },
      { label: "Classic", input: { root: [1,2,3] }, expected: 6 }
    ],
  },
  117: {
    no: 117,
    code: `class Solution {
  connect(root) {
    if (root === null) return null;
    let level = [root];
    while (level.length > 0) {
      const next = [];
      for (let i = 0; i < level.length; i++) {
        if (i < level.length - 1) level[i].next = level[i + 1];
        if (level[i].left) next.push(level[i].left);
        if (level[i].right) next.push(level[i].right);
      }
      level = next;
    }
    return root;
  }
}`,
    input: { root: [1, 2, 3, 4, 5, null, 7] },
    expected: [1, 2, 3, 4, 5, null, 7],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [1] },
      { label: "Skew", input: { root: [1,2,null,3] }, expected: "[1,#,2,#,3,#]" },
      { label: "Classic", input: { root: [1,2,3,4,5,7] }, expected: "[1,#,2,3,#,4,5,7,#]" }
    ],
  },
  173: {
    no: 173,
    code: `class Solution {
  inorderTraversal(root) {
    var result = [];
    var stack = [];
    var curr = root;
    while (curr !== null || stack.length > 0) {
      while (curr !== null) { stack.push(curr); curr = curr.left; }
      curr = stack.pop();
      result.push(curr.val);
      curr = curr.right;
    }
    return result;
  }
}`,
    input: { root: [7, 3, 15, null, null, 9, 20] },
    expected: [3, 7, 9, 15, 20],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: "null,[1]" },
      { label: "Left only", input: { root: [1,2,null,3] }, expected: "null,[1,2,3]" },
      { label: "Classic", input: { root: [7,3,15,null,9] }, expected: "null,[3,7,9,15]" }
    ],
  },

  // ── DP / Backtracking (wave 2) ──────────────────────────────────────────
  97: {
    no: 97,
    code: `class Solution {
  isInterleave(s1, s2, s3) {
    if (s1.length + s2.length !== s3.length) return false;
    const dp = Array.from({ length: s1.length + 1 }, () => new Array(s2.length + 1).fill(false));
    dp[0][0] = true;
    for (let i = 1; i <= s1.length; i++) dp[i][0] = dp[i - 1][0] && s1[i - 1] === s3[i - 1];
    for (let j = 1; j <= s2.length; j++) dp[0][j] = dp[0][j - 1] && s2[j - 1] === s3[j - 1];
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        dp[i][j] = (dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) ||
                   (dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]);
      }
    }
    return dp[s1.length][s2.length];
  }
}`,
    input: { s1: "aabcc", s2: "dbbca", s3: "aadbbcbcac" },
    expected: true,
    examples: [
      { label: "Edge: empty", input: { s1: "", s2: "", s3: "" }, expected: true },
      { label: "Not possible", input: { s1: "aa", s2: "ab", s3: "aaab" }, expected: false },
      { label: "Classic", input: { s1: "aab", s2: "axy", s3: "aaxaby" }, expected: true }
    ],
  },
  52: {
    no: 52,
    code: `class Solution {
  totalNQueens(n) {
    let count = 0;
    const board = new Array(n).fill(-1);

    const isValid = (row, col) => {
      for (let r = 0; r < row; r++) {
        const c = board[r];
        if (c === col || Math.abs(r - row) === Math.abs(c - col)) return false;
      }
      return true;
    };

    const backtrack = (row) => {
      if (row === n) {
        count++;
        return;
      }
      for (let col = 0; col < n; col++) {
        if (isValid(row, col)) {
          board[row] = col;
          backtrack(row + 1);
          board[row] = -1;
        }
      }
    };

    backtrack(0);
    return count;
  }
}`,
    input: { n: 4 },
    expected: 2,
    examples: [
      { label: "Edge: n=1", input: { n: 1 }, expected: [["Q"]] },
      { label: "n=2", input: { n: 2 }, expected: [] },
      { label: "Classic", input: { n: 4 }, expected: [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]] }
    ],
  },
  212: {
    no: 212,
    code: `class Solution {
  findWords(board, words) {
    const result = [];
    const trie = {};
    for (const word of words) {
      let node = trie;
      for (const ch of word) {
        if (!node[ch]) node[ch] = {};
        node = node[ch];
      }
      node.word = word;
    }

    const dfs = (r, c, node) => {
      if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return;
      const ch = board[r][c];
      if (ch === "#" || !node[ch]) return;
      const child = node[ch];
      if (child.word) {
        result.push(child.word);
        delete child.word;
      }
      board[r][c] = "#";
      dfs(r + 1, c, child);
      dfs(r - 1, c, child);
      dfs(r, c + 1, child);
      dfs(r, c - 1, child);
      board[r][c] = ch;
    };

    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[0].length; c++) {
        dfs(r, c, trie);
      }
    }
    return result;
  }
}`,
    input: { board: [["o", "a", "a", "n"], ["e", "t", "a", "e"], ["i", "h", "k", "r"], ["i", "f", "l", "v"]], words: ["oath", "pea", "eat", "rain"] },
    expected: ["oath", "eat"],
    examples: [
      { label: "No match", input: { board: [["a","b"],["c","d"]], words: ["efgh"] }, expected: [] },
      { label: "Single cell", input: { board: [["a"]], words: ["a","b"] }, expected: ["a"] },
      { label: "Classic", input: { board: [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words: ["oath","pea","eat","rain"] }, expected: ["oath","eat"] }
    ],
  },
};

/** Deep-link id used by the visualizer: /visualizer?t=top150-<no> */
export function top150TemplateId(no: number): string {
  return `top150-${no}`;
}

/** Resolve a deep-link id back to its template (undefined for unknown ids). */
export function top150TemplateFromId(id: string): Top150Template | undefined {
  const match = /^top150-(\d+)$/.exec(id);
  if (!match) return undefined;
  return top150Templates[Number(match[1])];
}

/** True when a question has a traceable template (drives the Visualize button). */
export function hasTop150Template(no: number): boolean {
  return top150Templates[no] !== undefined;
}

export type SolutionLanguage = "javascript" | "typescript" | "python" | "java" | "cpp";
export type SolutionVariant = "optimal" | "brute";

/** Resolves the code for a question/language/variant (undefined when absent). */
export function top150CodeFor(
  no: number,
  language: SolutionLanguage,
  variant: SolutionVariant,
): string | undefined {
  const template = top150Templates[no];
  if (!template) return undefined;
  // Check the unified languages map first (populated from individual fields + multilang).
  if (variant === "brute") {
    return template.bruteLanguages?.[language]
      ?? (language === "javascript" ? template.bruteCode : undefined)
      ?? (language === "python" ? (template.brutePythonCode ?? top150MultiLang[no]?.brutePythonCode) : undefined)
      ?? (language === "typescript" ? (template.bruteTypeScriptCode ?? top150MultiLang[no]?.bruteTypeScriptCode) : undefined)
      ?? (language === "java" ? top150MultiLang[no]?.bruteJavaCode : undefined)
      ?? (language === "cpp" ? top150MultiLang[no]?.bruteCppCode : undefined);
  }
  return template.languages?.[language]
    ?? (language === "javascript" ? template.code : undefined)
    ?? (language === "python" ? (template.pythonCode ?? top150MultiLang[no]?.pythonCode) : undefined)
    ?? (language === "typescript" ? (template.typescriptCode ?? top150MultiLang[no]?.typescriptCode) : undefined)
    ?? (language === "java" ? top150MultiLang[no]?.javaCode : undefined)
    ?? (language === "cpp" ? top150MultiLang[no]?.cppCode : undefined);
}

/** True when the question has code for the given language/variant. */
export function hasTop150Code(
  no: number,
  language: SolutionLanguage,
  variant: SolutionVariant = "optimal",
): boolean {
  return top150CodeFor(no, language, variant) !== undefined;
}

/**
 * Languages with an actual solution for this question (optimal or brute).
 * JavaScript always qualifies; TypeScript/Python only when a variant exists.
 * The language selector disables everything else so a question can never be
 * switched into a language that would silently break the run.
 */
export function top150LanguagesFor(no: number): SolutionLanguage[] {
  const languages: SolutionLanguage[] = ["javascript"];
  if (hasTop150Code(no, "typescript") || hasTop150Code(no, "typescript", "brute")) {
    languages.push("typescript");
  }
  if (hasTop150Code(no, "python") || hasTop150Code(no, "python", "brute")) {
    languages.push("python");
  }
  if (top150MultiLang[no]?.javaCode) languages.push("java");
  if (top150MultiLang[no]?.cppCode) languages.push("cpp");
  return languages;
}

/** Builds a synthetic AlgorithmTemplate the visualizer can render for a question. */
export function top150TemplateAsAlgorithmTemplate(
  no: number,
  title: string,
  topicTitle: string,
  code: string,
): AlgorithmTemplate {
  const template = top150Templates[no];
  const languages: Partial<Record<string, string>> = { javascript: template?.code };
  if (template?.pythonCode) languages.python = template.pythonCode;
  if (template?.typescriptCode) languages.typescript = template.typescriptCode;
  const bruteLanguages: Partial<Record<string, string>> = {};
  if (template?.bruteCode) bruteLanguages.javascript = template.bruteCode;
  if (template?.brutePythonCode) bruteLanguages.python = template.brutePythonCode;
  if (template?.bruteTypeScriptCode) bruteLanguages.typescript = template.bruteTypeScriptCode;
  return {
    id: top150TemplateId(no),
    name: title,
    category: topicTitle,
    code,
    input: template?.input ?? {},
    examples: template?.examples ?? [],
    languages,
    bruteCode: template?.bruteCode,
    bruteLanguages: Object.keys(bruteLanguages).length ? bruteLanguages : undefined,
  };
}
