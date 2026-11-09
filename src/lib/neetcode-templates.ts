// ---------------------------------------------------------------------------
// NeetCode Roadmap — traceable templates (wave 1).
//
// Complements top150-templates.ts: same LeetCode-format `class Solution` +
// example input + expected-result contract, but for NeetCode Roadmap problems
// that the Top Interview 150 bank doesn't cover. Problem numbers are canonical,
// so the visualizer resolves a deep link `top150-<no>` against the Top 150
// registry first and falls back here — a number can only live in one registry.
//
// Every entry is traced and result-verified in neetcode-templates.test.ts; a
// template only ships if it runs cleanly AND produces the expected answer.
// Design/state-machine problems (LRU cache, Min Stack, Trie, …) and
// trace-hostile giants are left for a later wave and show "Coming soon".
// ---------------------------------------------------------------------------

import { neetcodeMultiLang } from "./neetcode-multilang";
import { top150CodeFor, top150LanguagesFor, type SolutionLanguage } from "./top150-templates";
import { templateCodeFor, templateLanguagesFor, type AlgorithmTemplate } from "@/types/visualizer";

export type NeetCodeTemplate = {
  /** LeetCode problem number. */
  no: number;
  /** Canonical JS solution in LeetCode format (class Solution). */
  code: string;
  /** The problem's example input, matching the method's parameter names. */
  input: Record<string, unknown>;
  /** Expected result (worker-serialized: lists → arrays, trees → level-order). */
  expected?: unknown;
  /** Naive/brute-force JS code (shown via the Brute/Optimal toggle). */
  bruteCode?: string;
  /** Curated test cases the user can pick from in the input panel. */
  examples?: Array<{ label: string; input: Record<string, unknown>; expected: unknown }>;
};

export const neetcodeTemplates: Record<number, NeetCodeTemplate> = {
  // ── Arrays and Hashing ───────────────────────────────────────────────────
  217: {
    no: 217,
    code: `class Solution {
  containsDuplicate(nums) {
    return new Set(nums).size !== nums.length;
  }
}`,
    input: { nums: [1, 2, 3, 1] },
    expected: true,
    examples: [
      { label: "Edge: single", input: { nums: [1] }, expected: false },
      { label: "Edge: pair dup", input: { nums: [1, 1] }, expected: true },
      { label: "Typical", input: { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 1] }, expected: true },
    ],
  },
  268: {
    no: 268,
    code: `class Solution {
  missingNumber(nums) {
    const n = nums.length;
    let total = (n * (n + 1)) / 2;
    for (const num of nums) total -= num;
    return total;
  }
}`,
    input: { nums: [3, 0, 1] },
    expected: 2,
    examples: [
      { label: "Edge: [0]", input: { nums: [0] }, expected: 1 },
      { label: "Typical", input: { nums: [9, 6, 4, 2, 3, 5, 7, 0, 1] }, expected: 8 },
      { label: "Large", input: { nums: [0, 3] }, expected: 1 },
    ],
  },
  283: {
    no: 283,
    code: `class Solution {
  moveZeroes(nums) {
    let write = 0;
    for (let read = 0; read < nums.length; read++) {
      if (nums[read] !== 0) {
        nums[write] = nums[read];
        write++;
      }
    }
    for (let i = write; i < nums.length; i++) nums[i] = 0;
  }
}`,
    input: { nums: [0, 1, 0, 3, 12] },
    expected: [1, 3, 12, 0, 0],
    examples: [
      { label: "Edge: [0]", input: { nums: [0] }, expected: [0] },
      { label: "Typical", input: { nums: [0, 1, 0, 3, 12] }, expected: [1, 3, 12, 0, 0] },
      { label: "No zeros", input: { nums: [1, 2, 3] }, expected: [1, 2, 3] },
    ],
  },
  1929: {
    no: 1929,
    code: `class Solution {
  getConcatenation(nums) {
    return nums.concat(nums);
  }
}`,
    input: { nums: [1, 2, 1] },
    expected: [1, 2, 1, 1, 2, 1],
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: [1, 1] },
      { label: "Typical", input: { nums: [1, 2, 1] }, expected: [1, 2, 1, 1, 2, 1] },
      { label: "Distinct", input: { nums: [1, 2, 3] }, expected: [1, 2, 3, 1, 2, 3] },
    ],
  },
  929: {
    no: 929,
    code: `class Solution {
  numUniqueEmails(emails) {
    const seen = new Set();
    for (const email of emails) {
      const [local, domain] = email.split("@");
      const cleaned = local.split("+")[0].replace(/\\./g, "");
      seen.add(cleaned + "@" + domain);
    }
    return seen.size;
  }
}`,
    input: {
      emails: [
        "test.email+alex@leetcode.com",
        "test.e.mail+bob.cathy@leetcode.com",
        "testemail+david@lee.tcode.com",
      ],
    },
    expected: 2,
    examples: [
      { label: "Edge: single", input: { emails: ["a@leetcode.com"] }, expected: 1 },
      { label: "Typical", input: { emails: ["test.email+alex@leetcode.com", "test.e+bob@leetcode.com", "test@leetcode.com"] }, expected: 2 },
      { label: "All unique", input: { emails: ["a@x.com", "b@y.com"] }, expected: 2 },
    ],
  },
  448: {
    no: 448,
    code: `class Solution {
  findDisappearedNumbers(nums) {
    for (const num of nums) {
      const index = Math.abs(num) - 1;
      if (nums[index] > 0) nums[index] = -nums[index];
    }
    const result = [];
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] > 0) result.push(i + 1);
    }
    return result;
  }
}`,
    input: { nums: [4, 3, 2, 7, 8, 2, 3, 1] },
    expected: [5, 6],
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: [] },
      { label: "Typical", input: { nums: [4, 3, 2, 7, 8, 2, 3, 1] }, expected: [5, 6] },
      { label: "All missing", input: { nums: [2, 2] }, expected: [1, 3] },
    ],
  },
  560: {
    no: 560,
    code: `class Solution {
  subarraySum(nums, k) {
    const prefix = new Map();
    prefix.set(0, 1);
    let sum = 0;
    let count = 0;
    for (const num of nums) {
      sum += num;
      count += prefix.get(sum - k) ?? 0;
      prefix.set(sum, (prefix.get(sum) ?? 0) + 1);
    }
    return count;
  }
}`,
    input: { nums: [1, 1, 1], k: 2 },
    expected: 2,
    
    examples: [
      { label: "Edge: no match", input: { nums: [1], k: 0 }, expected: 0 },
      { label: "Typical", input: { nums: [1, 1, 1], k: 2 }, expected: 2 },
      { label: "Negative", input: { nums: [-1, -1, 1], k: 0 }, expected: 1 },
    ],
    bruteCode: `class Solution {
  subarraySum(nums, k) {
    let count = 0;
    for (let i = 0; i < nums.length; i++) {
      let sum = 0;
      for (let j = i; j < nums.length; j++) {
        sum += nums[j];
        if (sum === k) count++;
      }
    }
    return count;
  }
}`,
  },
  1299: {
    no: 1299,
    code: `class Solution {
  replaceElements(arr) {
    const result = new Array(arr.length);
    let max = -1;
    for (let i = arr.length - 1; i >= 0; i--) {
      result[i] = max;
      max = Math.max(max, arr[i]);
    }
    return result;
  }
}`,
    input: { arr: [17, 18, 5, 4, 6, 1] },
    expected: [18, 6, 6, 6, 1, -1],
    examples: [
      { label: "Edge: [100]", input: { arr: [100] }, expected: [-1] },
      { label: "Typical", input: { arr: [17, 18, 5, 4, 6, 1] }, expected: [18, 6, 6, 6, 1, -1] },
      { label: "Sorted desc", input: { arr: [5, 4, 3, 2, 1] }, expected: [5, 4, 3, 2, -1] },
    ],
  },
  1189: {
    no: 1189,
    code: `class Solution {
  maxNumberOfBalloons(text) {
    const counts = {};
    for (const char of text) counts[char] = (counts[char] || 0) + 1;
    return Math.floor(
      Math.min(
        counts["b"] || 0,
        counts["a"] || 0,
        Math.floor((counts["l"] || 0) / 2),
        Math.floor((counts["o"] || 0) / 2),
        counts["n"] || 0,
      ),
    );
  }
}`,
    input: { text: "nlaebolko" },
    expected: 1,
    examples: [
      { label: "Edge: no balloon", input: { text: "abc" }, expected: 0 },
      { label: "Typical", input: { text: "loonbalxballpoon" }, expected: 2 },
      { label: "One balloon", input: { text: "balloon" }, expected: 1 },
    ],
  },
  347: {
    no: 347,
    code: `class Solution {
  topKFrequent(nums, k) {
    const counts = new Map();
    for (const num of nums) counts.set(num, (counts.get(num) ?? 0) + 1);
    const buckets = new Array(nums.length + 1).fill(0).map(() => []);
    for (const [num, count] of counts) buckets[count].push(num);
    const result = [];
    for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
      for (const num of buckets[i]) {
        result.push(num);
        if (result.length === k) break;
      }
    }
    return result;
  }
}`,
    input: { nums: [1, 1, 1, 2, 2, 3], k: 2 },
    expected: [1, 2],
    examples: [
      { label: "Edge: k=1", input: { nums: [1], k: 1 }, expected: [1] },
      { label: "Typical", input: { nums: [1, 1, 1, 2, 2, 3], k: 2 }, expected: [1, 2] },
      { label: "All same", input: { nums: [4, 4, 4], k: 1 }, expected: [4] },
    ],
  },
  912: {
    no: 912,
    code: `class Solution {
  sortArray(nums) {
    return nums.slice().sort((a, b) => a - b);
  }
}`,
    input: { nums: [5, 2, 3, 1] },
    expected: [1, 2, 3, 5],
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: [1] },
      { label: "Typical", input: { nums: [5, 2, 3, 1] }, expected: [1, 2, 3, 5] },
      { label: "Negatives", input: { nums: [-1, -3, 2, 0] }, expected: [-3, -1, 0, 2] },
    ],
  },

  // ── Two Pointers ─────────────────────────────────────────────────────────
  344: {
    no: 344,
    code: `class Solution {
  reverseString(s) {
    let left = 0;
    let right = s.length - 1;
    while (left < right) {
      const temp = s[left];
      s[left] = s[right];
      s[right] = temp;
      left++;
      right--;
    }
  }
}`,
    input: { s: ["h", "e", "l", "l", "o"] },
    expected: ["o", "l", "l", "e", "h"],
    examples: [
      { label: "Edge: [a]", input: { s: ["a"] }, expected: ["a"] },
      { label: "Typical", input: { s: ["h", "e", "l", "l", "o"] }, expected: ["o", "l", "l", "e", "h"] },
      { label: "Even len", input: { s: ["H", "a", "n", "n", "a", "h"] }, expected: ["h", "a", "n", "n", "a", "H"] },
    ],
  },
  680: {
    no: 680,
    code: `class Solution {
  validPalindrome(s) {
    let left = 0;
    let right = s.length - 1;
    while (left < right) {
      if (s[left] !== s[right]) {
        return this.isPalindrome(s, left + 1, right) || this.isPalindrome(s, left, right - 1);
      }
      left++;
      right--;
    }
    return true;
  }
  isPalindrome(s, left, right) {
    while (left < right) {
      if (s[left] !== s[right]) return false;
      left++;
      right--;
    }
    return true;
  }
}`,
    input: { s: "abca" },
    expected: true,
    examples: [
      { label: "Edge: 'a'", input: { s: "a" }, expected: true },
      { label: "Typical: 'aba'", input: { s: "aba" }, expected: true },
      { label: "Remove b", input: { s: "abca" }, expected: true },
    ],
  },
  881: {
    no: 881,
    code: `class Solution {
  numRescueBoats(people, limit) {
    people.sort((a, b) => a - b);
    let left = 0;
    let right = people.length - 1;
    let boats = 0;
    while (left <= right) {
      if (people[left] + people[right] <= limit) left++;
      right--;
      boats++;
    }
    return boats;
  }
}`,
    input: { people: [1, 2], limit: 3 },
    expected: 1,
    examples: [
      { label: "Edge: single", input: { people: [1], limit: 3 }, expected: 1 },
      { label: "Typical", input: { people: [1, 2], limit: 3 }, expected: 1 },
      { label: "No pairs", input: { people: [3, 2, 2, 1], limit: 3 }, expected: 3 },
    ],
  },

  // ── Sliding Window ───────────────────────────────────────────────────────
  424: {
    no: 424,
    code: `class Solution {
  characterReplacement(s, k) {
    const counts = new Array(26).fill(0);
    let left = 0;
    let best = 0;
    let maxCount = 0;
    for (let right = 0; right < s.length; right++) {
      const index = s.charCodeAt(right) - 65;
      counts[index]++;
      maxCount = Math.max(maxCount, counts[index]);
      if (right - left + 1 - maxCount > k) {
        counts[s.charCodeAt(left) - 65]--;
        left++;
      }
      best = Math.max(best, right - left + 1);
    }
    return best;
  }
}`,
    input: { s: "ABAB", k: 2 },
    expected: 4,
    examples: [
      { label: "Edge: 'a'", input: { s: "a", k: 1 }, expected: 2 },
      { label: "Typical", input: { s: "AABABBA", k: 1 }, expected: 4 },
      { label: "All same", input: { s: "AAAA", k: 2 }, expected: 4 },
    ],
  },
  438: {
    no: 438,
    code: `class Solution {
  findAnagrams(s, p) {
    const result = [];
    const need = new Array(26).fill(0);
    for (const char of p) need[char.charCodeAt(0) - 97]++;
    const window = new Array(26).fill(0);
    for (let right = 0; right < s.length; right++) {
      window[s.charCodeAt(right) - 97]++;
      const left = right - p.length + 1;
      if (left > 0) window[s.charCodeAt(left - 1) - 97]--;
      if (left >= 0 && this.equal(need, window)) result.push(left);
    }
    return result;
  }
  equal(a, b) {
    for (let i = 0; i < 26; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}`,
    input: { s: "cbaebabacd", p: "abc" },
    expected: [0, 6],
    examples: [
      { label: "Edge: 'a'", input: { s: "a", p: "a" }, expected: [0] },
      { label: "Typical", input: { s: "cbaebabacd", p: "abc" }, expected: [0, 6] },
      { label: "No match", input: { s: "abc", p: "d" }, expected: [] },
    ],
  },
  567: {
    no: 567,
    code: `class Solution {
  checkInclusion(s1, s2) {
    if (s1.length > s2.length) return false;
    const need = new Array(26).fill(0);
    for (const char of s1) need[char.charCodeAt(0) - 97]++;
    const window = new Array(26).fill(0);
    for (let right = 0; right < s2.length; right++) {
      window[s2.charCodeAt(right) - 97]++;
      const left = right - s1.length;
      if (left >= 0) window[s2.charCodeAt(left) - 97]--;
      if (right >= s1.length - 1 && this.equal(need, window)) return true;
    }
    return false;
  }
  equal(a, b) {
    for (let i = 0; i < 26; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}`,
    input: { s1: "ab", s2: "eidbaooo" },
    expected: true,
    examples: [
      { label: "Edge: 'a','a'", input: { s: "a", t: "a" }, expected: true },
      { label: "Typical", input: { s: "ab", t: "eidbaooo" }, expected: true },
      { label: "No perm", input: { s: "ab", t: "eidboaoo" }, expected: false },
    ],
  },

  // ── Stack ────────────────────────────────────────────────────────────────
  682: {
    no: 682,
    code: `class Solution {
  calPoints(operations) {
    const stack = [];
    for (const op of operations) {
      if (op === "C") stack.pop();
      else if (op === "D") stack.push(stack[stack.length - 1] * 2);
      else if (op === "+") stack.push(stack[stack.length - 1] + stack[stack.length - 2]);
      else stack.push(Number(op));
    }
    return stack.reduce((sum, value) => sum + value, 0);
  }
}`,
    input: { operations: ["5", "2", "C", "D", "+"] },
    expected: 30,
    examples: [
      { label: "Classic", input: { ops: ["5", "2", "C", "D", "+"] }, expected: 30 },
      { label: "Triple", input: { ops: ["5", "-2", "4", "C", "D", "9", "+", "+"] }, expected: 27 },
      { label: "Simple", input: { ops: ["1", "C"] }, expected: 0 },
    ],
  },
  735: {
    no: 735,
    code: `class Solution {
  asteroidCollision(asteroids) {
    const stack = [];
    for (const asteroid of asteroids) {
      let alive = true;
      while (alive && asteroid < 0 && stack.length > 0 && stack[stack.length - 1] > 0) {
        const top = stack[stack.length - 1];
        if (top < -asteroid) {
          stack.pop();
        } else if (top === -asteroid) {
          stack.pop();
          alive = false;
        } else {
          alive = false;
        }
      }
      if (alive) stack.push(asteroid);
    }
    return stack;
  }
}`,
    input: { asteroids: [5, 10, -5] },
    expected: [5, 10],
    examples: [
      { label: "Edge: [1]", input: { asteroids: [1] }, expected: [1] },
      { label: "Collision", input: { asteroids: [10, 2, -5] }, expected: [10] },
      { label: "All collide", input: { asteroids: [8, -8] }, expected: [] },
    ],
  },
  739: {
    no: 739,
    code: `class Solution {
  dailyTemperatures(temperatures) {
    const result = new Array(temperatures.length).fill(0);
    const stack = [];
    for (let i = 0; i < temperatures.length; i++) {
      while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
        const index = stack.pop();
        result[index] = i - index;
      }
      stack.push(i);
    }
    return result;
  }
}`,
    input: { temperatures: [73, 74, 75, 71, 69, 72, 76, 73] },
    expected: [1, 1, 4, 2, 1, 1, 0, 0],
    examples: [
      { label: "Edge: [100]", input: { temperatures: [100] }, expected: [0] },
      { label: "Typical", input: { temperatures: [73, 74, 75, 71, 69, 72, 76, 73] }, expected: [1, 1, 4, 2, 1, 1, 0, 0] },
      { label: "Descending", input: { temperatures: [5, 4, 3, 2, 1] }, expected: [0, 0, 0, 0, 0] },
    ],
  },
  853: {
    no: 853,
    code: `class Solution {
  carFleet(target, position, speed) {
    const cars = position.map((pos, i) => [pos, (target - pos) / speed[i]]);
    cars.sort((a, b) => b[0] - a[0]);
    let fleets = 0;
    let slowest = 0;
    for (const [, time] of cars) {
      if (time > slowest) {
        fleets++;
        slowest = time;
      }
    }
    return fleets;
  }
}`,
    input: { target: 12, position: [10, 8, 0, 5, 3], speed: [2, 4, 1, 1, 3] },
    expected: 3,
    examples: [
      { label: "Edge: single", input: { positions: [2], target: 5, initSpeed: 2 }, expected: 1 },
      { label: "Typical", input: { positions: [2, 4], target: 5, initSpeed: 2 }, expected: 1 },
      { label: "Classic", input: { positions: [3, 4, 5], target: 7, initSpeed: 3 }, expected: 3 },
    ],
  },
  1209: {
    no: 1209,
    code: `class Solution {
  removeDuplicates(s, k) {
    const stack = [];
    for (const char of s) {
      if (stack.length > 0 && stack[stack.length - 1][0] === char) {
        stack[stack.length - 1][1]++;
        if (stack[stack.length - 1][1] === k) stack.pop();
      } else {
        stack.push([char, 1]);
      }
    }
    return stack.map(([char, count]) => char.repeat(count)).join("");
  }
}`,
    input: { s: "abcd", k: 2 },
    expected: "abcd",
    examples: [
      { label: "Edge: 'a'", input: { s: "a", k: 1 }, expected: "a" },
      { label: "Typical", input: { s: "deeedbbcccbdaa", k: 3 }, expected: "aa" },
      { label: "Full remove", input: { s: "abcd", k: 2 }, expected: "abcd" },
    ],
  },

  // ── Binary Search ────────────────────────────────────────────────────────
  704: {
    no: 704,
    code: `class Solution {
  search(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] === target) return mid;
      if (nums[mid] < target) left = mid + 1;
      else right = mid - 1;
    }
    return -1;
  }
}`,
    input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 },
    expected: 4,
    examples: [
      { label: "Edge: [-1]", input: { nums: [-1], target: -1 }, expected: 0 },
      { label: "Typical", input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 }, expected: 4 },
      { label: "Not found", input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 }, expected: -1 },
    ],
  },
  875: {
    no: 875,
    code: `class Solution {
  minEatingSpeed(piles, h) {
    const canEat = (speed) => {
      let hours = 0;
      for (const pile of piles) hours += Math.ceil(pile / speed);
      return hours <= h;
    };
    let left = 1;
    let right = Math.max(...piles);
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (canEat(mid)) right = mid;
      else left = mid + 1;
    }
    return left;
  }
}`,
    input: { piles: [3, 6, 7, 11], h: 8 },
    expected: 4,
    examples: [
      { label: "Edge: [1,1,1]", input: { piles: [1, 1, 1], h: 3 }, expected: 1 },
      { label: "Typical", input: { piles: [3, 6, 7, 11], h: 8 }, expected: 4 },
      { label: "Tight", input: { piles: [30, 11, 23, 4, 20], h: 5 }, expected: 30 },
    ],
  },
  977: {
    no: 977,
    code: `class Solution {
  sortedSquares(nums) {
    const result = new Array(nums.length);
    let left = 0;
    let right = nums.length - 1;
    for (let i = nums.length - 1; i >= 0; i--) {
      if (Math.abs(nums[left]) > Math.abs(nums[right])) {
        result[i] = nums[left] * nums[left];
        left++;
      } else {
        result[i] = nums[right] * nums[right];
        right--;
      }
    }
    return result;
  }
}`,
    input: { nums: [-4, -1, 0, 3, 10] },
    expected: [0, 1, 9, 16, 100],
    examples: [
      { label: "Edge: [-3]", input: { nums: [-3] }, expected: [9] },
      { label: "Typical", input: { nums: [-4, -1, 0, 3, 10] }, expected: [0, 1, 9, 16, 100] },
      { label: "All neg", input: { nums: [-7, -3, 2, 3, 11] }, expected: [4, 9, 9, 49, 121] },
    ],
  },
  367: {
    no: 367,
    code: `class Solution {
  isPerfectSquare(num) {
    let left = 1;
    let right = num;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const square = mid * mid;
      if (square === num) return true;
      if (square < num) left = mid + 1;
      else right = mid - 1;
    }
    return false;
  }
}`,
    input: { num: 16 },
    expected: true,
    examples: [
      { label: "Edge: 1", input: { num: 1 }, expected: true },
      { label: "Typical", input: { num: 4 }, expected: true },
      { label: "Not perfect", input: { num: 5 }, expected: false },
    ],
  },
  441: {
    no: 441,
    code: `class Solution {
  arrangeCoins(n) {
    let left = 1;
    let right = n;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const used = (mid * (mid + 1)) / 2;
      if (used <= n) left = mid + 1;
      else right = mid - 1;
    }
    return right;
  }
}`,
    input: { n: 5 },
    expected: 2,
    examples: [
      { label: "Edge: 0", input: { n: 0 }, expected: 0 },
      { label: "1 row", input: { n: 1 }, expected: 1 },
      { label: "Typical", input: { n: 5 }, expected: 2 },
    ],
  },

  // ── Linked List ──────────────────────────────────────────────────────────
  206: {
    no: 206,
    code: `class Solution {
  reverseList(head) {
    let prev = null;
    let current = head;
    while (current !== null) {
      const next = current.next;
      current.next = prev;
      prev = current;
      current = next;
    }
    return prev;
  }
}`,
    input: { head: [1, 2, 3, 4, 5] },
    expected: [5, 4, 3, 2, 1],
    examples: [
      { label: "Edge: [1]", input: { head: [1] }, expected: [1] },
      { label: "Typical", input: { head: [1, 2, 3, 4, 5] }, expected: [5, 4, 3, 2, 1] },
      { label: "Pair", input: { head: [1, 2] }, expected: [2, 1] },
    ],
  },
  876: {
    no: 876,
    code: `class Solution {
  middleNode(head) {
    let slow = head;
    let fast = head;
    while (fast !== null && fast.next !== null) {
      slow = slow.next;
      fast = fast.next.next;
    }
    return slow;
  }
}`,
    input: { head: [1, 2, 3, 4, 5] },
    expected: [3, 4, 5],
    examples: [
      { label: "Edge: [1,2]", input: { head: [1, 2] }, expected: [2] },
      { label: "Typical", input: { head: [1, 2, 3, 4, 5] }, expected: [3, 4, 5] },
      { label: "Single", input: { head: [1] }, expected: [1] },
    ],
  },
  234: {
    no: 234,
    code: `class Solution {
  isPalindrome(head) {
    let slow = head;
    let fast = head;
    while (fast !== null && fast.next !== null) {
      slow = slow.next;
      fast = fast.next.next;
    }
    let prev = null;
    let current = slow;
    while (current !== null) {
      const next = current.next;
      current.next = prev;
      prev = current;
      current = next;
    }
    let left = head;
    let right = prev;
    while (right !== null) {
      if (left.val !== right.val) return false;
      left = left.next;
      right = right.next;
    }
    return true;
  }
}`,
    input: { head: [1, 2, 2, 1] },
    expected: true,
    examples: [
      { label: "Edge: [1]", input: { head: [1] }, expected: true },
      { label: "Typical", input: { head: [1, 2, 2, 1] }, expected: true },
      { label: "Not palindrome", input: { head: [1, 2] }, expected: false },
    ],
  },
  203: {
    no: 203,
    code: `class Solution {
  removeElements(head, val) {
    const dummy = new ListNode(0, head);
    let prev = dummy;
    let current = head;
    while (current !== null) {
      if (current.val === val) prev.next = current.next;
      else prev = current;
      current = current.next;
    }
    return dummy.next;
  }
}`,
    input: { head: [1, 2, 6, 3, 4, 5, 6], val: 6 },
    expected: [1, 2, 3, 4, 5],
    examples: [
      { label: "Edge: [1], remove 1", input: { head: [1], val: 1 }, expected: [] },
      { label: "Typical", input: { head: [1, 2, 6, 3, 4, 5, 6], val: 6 }, expected: [1, 2, 3, 4, 5] },
      { label: "None removed", input: { head: [1, 2, 3], val: 4 }, expected: [1, 2, 3] },
    ],
  },
  2130: {
    no: 2130,
    code: `class Solution {
  pairSum(head) {
    let slow = head;
    let fast = head;
    while (fast !== null && fast.next !== null) {
      slow = slow.next;
      fast = fast.next.next;
    }
    let prev = null;
    let current = slow;
    while (current !== null) {
      const next = current.next;
      current.next = prev;
      prev = current;
      current = next;
    }
    let left = head;
    let right = prev;
    let best = 0;
    while (right !== null) {
      best = Math.max(best, left.val + right.val);
      left = left.next;
      right = right.next;
    }
    return best;
  }
}`,
    input: { head: [5, 4, 2, 1] },
    expected: 6,
    examples: [
      { label: "Edge: [1]", input: { head: [1] }, expected: 1 },
      { label: "Typical", input: { head: [1, 2, 3, 4, 5] }, expected: 6 },
      { label: "All same", input: { head: [1, 1, 1] }, expected: 2 },
    ],
  },

  // ── Trees ────────────────────────────────────────────────────────────────
  94: {
    no: 94,
    code: `class Solution {
  inorderTraversal(root) {
    const result = [];
    const walk = (node) => {
      if (node === null) return;
      walk(node.left);
      result.push(node.val);
      walk(node.right);
    };
    walk(root);
    return result;
  }
}`,
    input: { root: [1, null, 2, 3] },
    expected: [1, 3, 2],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [1] },
      { label: "Typical", input: { root: [1, 2, 3] }, expected: [1, 3, 2] },
      { label: "Right only", input: { root: [1, null, 2, 3] }, expected: [1, 2, 3] },
    ],
  },
  144: {
    no: 144,
    code: `class Solution {
  preorderTraversal(root) {
    const result = [];
    const walk = (node) => {
      if (node === null) return;
      result.push(node.val);
      walk(node.left);
      walk(node.right);
    };
    walk(root);
    return result;
  }
}`,
    input: { root: [1, null, 2, 3] },
    expected: [1, 2, 3],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [1] },
      { label: "Typical", input: { root: [1, 2, 3] }, expected: [1, 2, 3] },
      { label: "Right only", input: { root: [1, null, 2] }, expected: [1, 2] },
    ],
  },
  145: {
    no: 145,
    code: `class Solution {
  postorderTraversal(root) {
    const result = [];
    const walk = (node) => {
      if (node === null) return;
      walk(node.left);
      walk(node.right);
      result.push(node.val);
    };
    walk(root);
    return result;
  }
}`,
    input: { root: [1, null, 2, 3] },
    expected: [3, 2, 1],
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: [1] },
      { label: "Typical", input: { root: [1, 2, 3] }, expected: [3, 2, 1] },
      { label: "Right only", input: { root: [1, null, 2, 3] }, expected: [3, 2, 1] },
    ],
  },
  110: {
    no: 110,
    code: `class Solution {
  isBalanced(root) {
    return this.height(root) !== -1;
  }
  height(node) {
    if (node === null) return 0;
    const left = this.height(node.left);
    if (left === -1) return -1;
    const right = this.height(node.right);
    if (right === -1) return -1;
    if (Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
  }
}`,
    input: { root: [3, 9, 20, null, null, 15, 7] },
    expected: true,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: true },
      { label: "Typical", input: { root: [3, 9, 20, null, null, 15, 7] }, expected: true },
      { label: "Unbalanced", input: { root: [1, 2, 2, 3, 3, null, null, 4, 4] }, expected: false },
    ],
  },
  543: {
    no: 543,
    code: `class Solution {
  diameterOfBinaryTree(root) {
    let best = 0;
    const depth = (node) => {
      if (node === null) return 0;
      const left = depth(node.left);
      const right = depth(node.right);
      best = Math.max(best, left + right);
      return 1 + Math.max(left, right);
    };
    depth(root);
    return best;
  }
}`,
    input: { root: [1, 2, 3, 4, 5] },
    expected: 3,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: 1 },
      { label: "Typical", input: { root: [1, 2, 3] }, expected: 3 },
      { label: "Skew", input: { root: [1, 2, null, 3] }, expected: 2 },
    ],
  },
  572: {
    no: 572,
    code: `class Solution {
  isSubtree(root, subRoot) {
    if (root === null) return false;
    if (this.same(root, subRoot)) return true;
    return this.isSubtree(root.left, subRoot) || this.isSubtree(root.right, subRoot);
  }
  same(a, b) {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.val === b.val && this.same(a.left, b.left) && this.same(a.right, b.right);
  }
}`,
    input: { root: [3, 4, 5, 1, 2], subRoot: [4, 1, 2] },
    expected: true,
    examples: [
      { label: "Edge: [1]", input: { root: [1], subRoot: [1] }, expected: true },
      { label: "Typical", input: { root: [3, 4, 5, 1, 2], subRoot: [4, 1, 2] }, expected: true },
      { label: "Not sub", input: { root: [3, 4, 5, 1, 2, null, null, null, null, 0], subRoot: [4, 1, 2] }, expected: false },
    ],
  },
  617: {
    no: 617,
    code: `class Solution {
  mergeTrees(root1, root2) {
    if (root1 === null) return root2;
    if (root2 === null) return root1;
    root1.val += root2.val;
    root1.left = this.mergeTrees(root1.left, root2.left);
    root1.right = this.mergeTrees(root1.right, root2.right);
    return root1;
  }
}`,
    input: { root1: [1, 3, 2, 5], root2: [2, 1, 3, null, 4, null, 7] },
    expected: [3, 4, 5, 5, 4, null, 7],
    examples: [
      { label: "Edge: [1]+[2]", input: { root1: [1], root2: [2] }, expected: [3] },
      { label: "Typical", input: { root1: [1, 3, 2, 5], root2: [2, 1, 3, null, 4, null, 7] }, expected: [3, 4, 5, 5, 4, null, 7] },
      { label: "Empty", input: { root1: [], root2: [1] }, expected: [1] },
    ],
  },
  235: {
    no: 235,
    code: `class Solution {
  lowestCommonAncestor(root, p, q) {
    let node = root;
    while (node !== null) {
      if (p < node.val && q < node.val) node = node.left;
      else if (p > node.val && q > node.val) node = node.right;
      else return node;
    }
    return null;
  }
}`,
    input: { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 },
    expected: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5],
    examples: [
      { label: "Edge: direct child", input: { root: [2, 1, 3], p: 1, q: 3 }, expected: [2] },
      { label: "Typical", input: { root: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 }, expected: [6] },
      { label: "Left subtree", input: { root: [6, 2, 8, 0, 4, 7, 9], p: 2, q: 4 }, expected: [2] },
    ],
  },
  701: {
    no: 701,
    code: `class Solution {
  insertIntoBST(root, val) {
    if (root === null) return new TreeNode(val);
    if (val < root.val) root.left = this.insertIntoBST(root.left, val);
    else root.right = this.insertIntoBST(root.right, val);
    return root;
  }
}`,
    input: { root: [4, 2, 7, 1, 3], val: 5 },
    expected: [4, 2, 7, 1, 3, 5],
    examples: [
      { label: "Edge: [1]+2", input: { root: [1], val: 2 }, expected: [1, 2] },
      { label: "Typical", input: { root: [4, 2, 7, 1, 3], val: 5 }, expected: [4, 2, 7, 1, 3, 5] },
      { label: "Insert 6", input: { root: [4, 2, 7, 1, 3], val: 6 }, expected: [4, 2, 7, 1, 3, 6] },
    ],
  },
  450: {
    no: 450,
    code: `class Solution {
  deleteNode(root, key) {
    if (root === null) return null;
    if (key < root.val) root.left = this.deleteNode(root.left, key);
    else if (key > root.val) root.right = this.deleteNode(root.right, key);
    else {
      if (root.left === null) return root.right;
      if (root.right === null) return root.left;
      let successor = root.right;
      while (successor.left !== null) successor = successor.left;
      root.val = successor.val;
      root.right = this.deleteNode(root.right, successor.val);
    }
    return root;
  }
}`,
    input: { root: [5, 3, 6, 2, 4, null, 7], key: 3 },
    expected: [5, 4, 6, 2, null, null, 7],
    examples: [
      { label: "Edge: leaf", input: { root: [1], key: 1 }, expected: [] },
      { label: "Typical", input: { root: [5, 3, 6, 2, 4, null, 7], key: 3 }, expected: [5, 4, 6, 2, null, null, 7] },
      { label: "Root", input: { root: [5, 3, 6, 2, 4, null, 7], key: 5 }, expected: [6, 3, 7, 2, 4] },
    ],
  },
  1448: {
    no: 1448,
    code: `class Solution {
  goodNodes(root) {
    return this.count(root, -Infinity);
  }
  count(node, maxSoFar) {
    if (node === null) return 0;
    const good = node.val >= maxSoFar ? 1 : 0;
    const nextMax = Math.max(maxSoFar, node.val);
    return good + this.count(node.left, nextMax) + this.count(node.right, nextMax);
  }
}`,
    input: { root: [3, 1, 4, 3, null, 1, 5] },
    expected: 4,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: 1 },
      { label: "Typical", input: { root: [1, 2, 3] }, expected: 4 },
      { label: "Chain", input: { root: [1, 2, 3, 4, 5] }, expected: 13 },
    ],
  },
  606: {
    no: 606,
    code: `class Solution {
  tree2str(root) {
    if (root === null) return "";
    if (root.left === null && root.right === null) return String(root.val);
    const left = this.tree2str(root.left);
    const right = this.tree2str(root.right);
    let result = String(root.val) + "(" + left + ")";
    if (right !== "") result += "(" + right + ")";
    return result;
  }
}`,
    input: { root: [1, 2, 3, 4] },
    expected: "1(2(4))(3)",
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: "1" },
      { label: "Typical", input: { root: [1, 2, 3, 4] }, expected: "1(2(4))(3)" },
      { label: "Right only", input: { root: [1, 2, 3, null, 4] }, expected: "1(2()(4))(3)" },
    ],
  },

  // ── Backtracking ─────────────────────────────────────────────────────────
  78: {
    no: 78,
    code: `class Solution {
  subsets(nums) {
    const result = [];
    const backtrack = (start, current) => {
      result.push([...current]);
      for (let i = start; i < nums.length; i++) {
        current.push(nums[i]);
        backtrack(i + 1, current);
        current.pop();
      }
    };
    backtrack(0, []);
    return result;
  }
}`,
    input: { nums: [1, 2, 3] },
    expected: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]],
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: [[], [1]] },
      { label: "Typical", input: { nums: [1, 2, 3] }, expected: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]] },
      { label: "Dups", input: { nums: [1, 2, 2] }, expected: [[], [1], [1, 2], [1, 2, 2], [1, 2], [2], [2, 2], [2]] },
    ],
  },
  90: {
    no: 90,
    code: `class Solution {
  subsetsWithDup(nums) {
    nums.sort((a, b) => a - b);
    const result = [];
    const backtrack = (start, current) => {
      result.push([...current]);
      for (let i = start; i < nums.length; i++) {
        if (i > start && nums[i] === nums[i - 1]) continue;
        current.push(nums[i]);
        backtrack(i + 1, current);
        current.pop();
      }
    };
    backtrack(0, []);
    return result;
  }
}`,
    input: { nums: [1, 2, 2] },
    expected: [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]],
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: [[], [1]] },
      { label: "Typical", input: { nums: [1, 2, 2] }, expected: [[], [1], [1, 2], [1, 2, 2], [1, 2], [2], [2, 2], [2]] },
      { label: "No dups", input: { nums: [1, 2, 3] }, expected: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]] },
    ],
  },
  40: {
    no: 40,
    code: `class Solution {
  combinationSum2(candidates, target) {
    candidates.sort((a, b) => a - b);
    const result = [];
    const backtrack = (start, current, sum) => {
      if (sum === target) {
        result.push([...current]);
        return;
      }
      if (sum > target) return;
      for (let i = start; i < candidates.length; i++) {
        if (i > start && candidates[i] === candidates[i - 1]) continue;
        current.push(candidates[i]);
        backtrack(i + 1, current, sum + candidates[i]);
        current.pop();
      }
    };
    backtrack(0, [], 0);
    return result;
  }
}`,
    input: { candidates: [10, 1, 2, 7, 6, 1, 5], target: 8 },
    expected: [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]],
    examples: [
      { label: "Edge: [1]", input: { nums: [1], target: 1 }, expected: [[1]] },
      { label: "Classic", input: { nums: [10, 1, 2, 7, 6, 1, 5], target: 8 }, expected: [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]] },
      { label: "No combo", input: { nums: [1, 2, 3], target: 7 }, expected: [] },
    ],
  },
  131: {
    no: 131,
    code: `class Solution {
  partition(s) {
    const result = [];
    const backtrack = (start, current) => {
      if (start === s.length) {
        result.push([...current]);
        return;
      }
      for (let end = start; end < s.length; end++) {
        if (this.isPalindrome(s, start, end)) {
          current.push(s.slice(start, end + 1));
          backtrack(end + 1, current);
          current.pop();
        }
      }
    };
    backtrack(0, []);
    return result;
  }
  isPalindrome(s, left, right) {
    while (left < right) {
      if (s[left] !== s[right]) return false;
      left++;
      right--;
    }
    return true;
  }
}`,
    input: { s: "aab" },
    expected: [["a", "a", "b"], ["aa", "b"]],
    examples: [
      { label: "Edge: 'a'", input: { s: "a" }, expected: [["a"]] },
      { label: "Classic", input: { s: "aab" }, expected: [["a", "a", "b"], ["aa", "b"]] },
      { label: "No palindrome", input: { s: "abc" }, expected: [["a", "b", "c"]] },
    ],
  },
  93: {
    no: 93,
    code: `class Solution {
  restoreIpAddresses(s) {
    const result = [];
    const backtrack = (start, parts) => {
      if (parts.length === 4) {
        if (start === s.length) result.push(parts.join("."));
        return;
      }
      if (start >= s.length) return;
      for (let len = 1; len <= 3 && start + len <= s.length; len++) {
        const segment = s.slice(start, start + len);
        if (len > 1 && segment[0] === "0") continue;
        if (Number(segment) > 255) continue;
        parts.push(segment);
        backtrack(start + len, parts);
        parts.pop();
      }
    };
    backtrack(0, []);
    return result;
  }
}`,
    input: { s: "25525511135" },
    expected: ["255.255.11.135", "255.255.111.35"],
    examples: [
      { label: "Edge: '0000'", input: { s: "0000" }, expected: ["0.0.0.0"] },
      { label: "Typical", input: { s: "25525511135" }, expected: ["255.255.11.135", "255.255.111.35"] },
      { label: "No valid", input: { s: "00000" }, expected: [] },
    ],
  },
  51: {
    no: 51,
    code: `class Solution {
  solveNQueens(n) {
    const result = [];
    const board = new Array(n).fill(0).map(() => new Array(n).fill("."));
    const cols = new Set();
    const diag1 = new Set();
    const diag2 = new Set();
    const place = (row) => {
      if (row === n) {
        result.push(board.map((r) => r.join("")));
        return;
      }
      for (let col = 0; col < n; col++) {
        const d1 = row - col;
        const d2 = row + col;
        if (cols.has(col) || diag1.has(d1) || diag2.has(d2)) continue;
        board[row][col] = "Q";
        cols.add(col);
        diag1.add(d1);
        diag2.add(d2);
        place(row + 1);
        board[row][col] = ".";
        cols.delete(col);
        diag1.delete(d1);
        diag2.delete(d2);
      }
    };
    place(0);
    return result;
  }
}`,
    input: { n: 4 },
    expected: [
      [".Q..", "...Q", "Q...", "..Q."],
      ["..Q.", "Q...", "...Q", ".Q.."],
    ],
    examples: [
      { label: "Edge: n=1", input: { n: 1 }, expected: [["Q"]] },
      { label: "n=2", input: { n: 2 }, expected: [] },
      { label: "n=4", input: { n: 4 }, expected: [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]] },
    ],
  },

  // ── 1-D Dynamic Programming ──────────────────────────────────────────────
  91: {
    no: 91,
    code: `class Solution {
  numDecodings(s) {
    if (s.length === 0 || s[0] === "0") return 0;
    let oneBack = 1;
    let twoBack = 1;
    for (let i = 1; i < s.length; i++) {
      let current = 0;
      if (s[i] !== "0") current += oneBack;
      const two = Number(s.slice(i - 1, i + 1));
      if (two >= 10 && two <= 26) current += twoBack;
      twoBack = oneBack;
      oneBack = current;
    }
    return oneBack;
  }
}`,
    input: { s: "12" },
    expected: 2,
    examples: [
      { label: "Edge: '0'", input: { s: "0" }, expected: 0 },
      { label: "Classic", input: { s: "12" }, expected: 2 },
      { label: "Triple", input: { s: "226" }, expected: 3 },
    ],
  },
  152: {
    no: 152,
    code: `class Solution {
  maxProduct(nums) {
    let best = nums[0];
    let max = nums[0];
    let min = nums[0];
    for (let i = 1; i < nums.length; i++) {
      const candidates = [nums[i], max * nums[i], min * nums[i]];
      max = Math.max(...candidates);
      min = Math.min(...candidates);
      best = Math.max(best, max);
    }
    return best;
  }
}`,
    input: { nums: [2, 3, -2, 4] },
    expected: 6,
    examples: [
      { label: "Edge: [0]", input: { nums: [0] }, expected: 0 },
      { label: "Typical", input: { nums: [2, 3, -2, 4] }, expected: 6 },
      { label: "Two neg", input: { nums: [-2, 0, -1] }, expected: 0 },
    ],
  },
  213: {
    no: 213,
    code: `class Solution {
  rob(nums) {
    if (nums.length === 1) return nums[0];
    const robRange = (start, end) => {
      let prev = 0;
      let current = 0;
      for (let i = start; i <= end; i++) {
        const next = Math.max(current, prev + nums[i]);
        prev = current;
        current = next;
      }
      return current;
    };
    return Math.max(robRange(0, nums.length - 2), robRange(1, nums.length - 1));
  }
}`,
    input: { nums: [2, 3, 2] },
    expected: 3,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 1 },
      { label: "Typical", input: { nums: [2, 3, 2] }, expected: 3 },
      { label: "Classic", input: { nums: [1, 2, 3, 1] }, expected: 4 },
    ],
  },
  338: {
    no: 338,
    code: `class Solution {
  countBits(n) {
    const result = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      result[i] = result[i >> 1] + (i & 1);
    }
    return result;
  }
}`,
    input: { n: 5 },
    expected: [0, 1, 1, 2, 1, 2],
    examples: [
      { label: "Edge: 0", input: { n: 0 }, expected: [0] },
      { label: "Typical", input: { n: 5 }, expected: [0, 1, 1, 2, 1, 2] },
      { label: "n=2", input: { n: 2 }, expected: [0, 1, 1] },
    ],
  },
  416: {
    no: 416,
    code: `class Solution {
  canPartition(nums) {
    const total = nums.reduce((sum, num) => sum + num, 0);
    if (total % 2 !== 0) return false;
    const target = total / 2;
    const possible = new Array(target + 1).fill(false);
    possible[0] = true;
    for (const num of nums) {
      for (let sum = target; sum >= num; sum--) {
        if (possible[sum - num]) possible[sum] = true;
      }
    }
    return possible[target];
  }
}`,
    input: { nums: [1, 5, 11, 5] },
    expected: true,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: false },
      { label: "Typical", input: { nums: [1, 5, 11, 5] }, expected: true },
      { label: "Classic", input: { nums: [1, 2, 3, 5] }, expected: false },
    ],
  },
  746: {
    no: 746,
    code: `class Solution {
  minCostClimbingStairs(cost) {
    let prev = 0;
    let current = 0;
    for (let i = 2; i <= cost.length; i++) {
      const next = Math.min(current + cost[i - 1], prev + cost[i - 2]);
      prev = current;
      current = next;
    }
    return current;
  }
}`,
    input: { cost: [10, 15, 20] },
    expected: 15,
    examples: [
      { label: "Edge: [1]", input: { cost: [1] }, expected: 0 },
      { label: "Typical", input: { cost: [10, 15, 20] }, expected: 15 },
      { label: "Classic", input: { cost: [1, 100, 1, 1, 1, 100, 1, 1, 100, 1] }, expected: 6 },
    ],
  },
  279: {
    no: 279,
    code: `class Solution {
  numSquares(n) {
    const dp = new Array(n + 1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= n; i++) {
      for (let s = 1; s * s <= i; s++) {
        dp[i] = Math.min(dp[i], dp[i - s * s] + 1);
      }
    }
    return dp[n];
  }
}`,
    input: { n: 12 },
    expected: 3,
    examples: [
      { label: "Edge: 1", input: { n: 1 }, expected: 1 },
      { label: "Typical", input: { n: 12 }, expected: 3 },
      { label: "Prime", input: { n: 7 }, expected: 4 },
    ],
  },

  // ── 2-D Dynamic Programming ──────────────────────────────────────────────
  62: {
    no: 62,
    code: `class Solution {
  uniquePaths(m, n) {
    const dp = new Array(n).fill(1);
    for (let row = 1; row < m; row++) {
      for (let col = 1; col < n; col++) {
        dp[col] += dp[col - 1];
      }
    }
    return dp[n - 1];
  }
}`,
    input: { m: 3, n: 7 },
    expected: 28,
    examples: [
      { label: "Edge: 1x1", input: { m: 1, n: 1 }, expected: 1 },
      { label: "Classic", input: { m: 3, n: 7 }, expected: 28 },
      { label: "Square", input: { m: 3, n: 3 }, expected: 6 },
    ],
  },
  518: {
    no: 518,
    code: `class Solution {
  change(amount, coins) {
    const ways = new Array(amount + 1).fill(0);
    ways[0] = 1;
    for (const coin of coins) {
      for (let sum = coin; sum <= amount; sum++) {
        ways[sum] += ways[sum - coin];
      }
    }
    return ways[amount];
  }
}`,
    input: { amount: 5, coins: [1, 2, 5] },
    expected: 4,
    examples: [
      { label: "Edge: no coins", input: { coins: [], amount: 0 }, expected: 1 },
      { label: "Typical", input: { coins: [1, 5, 10, 25], amount: 30 }, expected: 2 },
      { label: "Classic", input: { coins: [1, 2, 5], amount: 11 }, expected: 3 },
    ],
  },
  1143: {
    no: 1143,
    code: `class Solution {
  longestCommonSubsequence(text1, text2) {
    const rows = text1.length;
    const cols = text2.length;
    const dp = new Array(rows + 1).fill(0).map(() => new Array(cols + 1).fill(0));
    for (let i = 1; i <= rows; i++) {
      for (let j = 1; j <= cols; j++) {
        if (text1[i - 1] === text2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    return dp[rows][cols];
  }
}`,
    input: { text1: "abcde", text2: "ace" },
    expected: 3,
    examples: [
      { label: "Edge: empty", input: { text1: "", text2: "abc" }, expected: 0 },
      { label: "Typical", input: { text1: "abcde", text2: "ace" }, expected: 3 },
      { label: "Same", input: { text1: "abc", text2: "abc" }, expected: 3 },
    ],
  },
  516: {
    no: 516,
    code: `class Solution {
  longestPalindromeSubseq(s) {
    const n = s.length;
    const dp = new Array(n).fill(0).map(() => new Array(n).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      dp[i][i] = 1;
      for (let j = i + 1; j < n; j++) {
        if (s[i] === s[j]) dp[i][j] = dp[i + 1][j - 1] + 2;
        else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
    return dp[0][n - 1];
  }
}`,
    input: { s: "bbbab" },
    expected: 4,
    examples: [
      { label: "Edge: 'a'", input: { s: "a" }, expected: 1 },
      { label: "Classic", input: { s: "bbbab" }, expected: 4 },
      { label: "Full pal", input: { s: "racecar" }, expected: 7 },
    ],
  },

  // ── Greedy ───────────────────────────────────────────────────────────────
  455: {
    no: 455,
    code: `class Solution {
  findContentChildren(g, s) {
    g.sort((a, b) => a - b);
    s.sort((a, b) => a - b);
    let child = 0;
    let cookie = 0;
    while (child < g.length && cookie < s.length) {
      if (s[cookie] >= g[child]) child++;
      cookie++;
    }
    return child;
  }
}`,
    input: { g: [1, 2, 3], s: [1, 1] },
    expected: 1,
    examples: [
      { label: "Edge: no cookies", input: { g: [1, 2], s: [] }, expected: 0 },
      { label: "Classic", input: { g: [1, 2, 3], s: [1, 1] }, expected: 1 },
      { label: "All fit", input: { g: [1, 2], s: [1, 2, 3] }, expected: 2 },
    ],
  },
  621: {
    no: 621,
    code: `class Solution {
  leastInterval(tasks, n) {
    const counts = new Array(26).fill(0);
    for (const task of tasks) counts[task.charCodeAt(0) - 65]++;
    const maxCount = Math.max(...counts);
    const maxTasks = counts.filter((count) => count === maxCount).length;
    return Math.max(tasks.length, (maxCount - 1) * (n + 1) + maxTasks);
  }
}`,
    input: { tasks: ["A", "A", "A", "B", "B", "B"], n: 2 },
    expected: 8,
    examples: [
      { label: "Edge: [A]", input: { tasks: ["A"], n: 0 }, expected: 1 },
      { label: "Typical", input: { tasks: ["A", "A", "A", "B", "B", "B"], n: 2 }, expected: 8 },
      { label: "No idle", input: { tasks: ["A", "B"], n: 0 }, expected: 2 },
    ],
  },
  763: {
    no: 763,
    code: `class Solution {
  partitionLabels(s) {
    const last = {};
    for (let i = 0; i < s.length; i++) last[s[i]] = i;
    const result = [];
    let start = 0;
    let end = 0;
    for (let i = 0; i < s.length; i++) {
      end = Math.max(end, last[s[i]]);
      if (i === end) {
        result.push(end - start + 1);
        start = end + 1;
      }
    }
    return result;
  }
}`,
    input: { s: "ababcbacadefegdehijhklij" },
    expected: [9, 7, 8],
    examples: [
      { label: "Edge: single", input: { s: "ab", left: [0], right: [1] }, expected: [1] },
      { label: "Classic", input: { s: "abccaddbfef", left: [0, 5, 2], right: [3, 6, 4] }, expected: [9, 7, 8] },
      { label: "All same", input: { s: "aaa", left: [0], right: [2] }, expected: [3] },
    ],
  },
  846: {
    no: 846,
    code: `class Solution {
  isNStraightHand(hand, groupSize) {
    if (hand.length % groupSize !== 0) return false;
    const counts = new Map();
    for (const card of hand) counts.set(card, (counts.get(card) ?? 0) + 1);
    const unique = [...counts.keys()].sort((a, b) => a - b);
    for (const card of unique) {
      const count = counts.get(card);
      if (count === 0) continue;
      for (let next = card; next < card + groupSize; next++) {
        const available = counts.get(next) ?? 0;
        if (available < count) return false;
        counts.set(next, available - count);
      }
    }
    return true;
  }
}`,
    input: { hand: [1, 2, 3, 6, 2, 3, 4, 7, 8], groupSize: 3 },
    expected: true,
    examples: [
      { label: "Edge: [1,1]", input: { hand: [1, 1], groupSize: 1 }, expected: true },
      { label: "Typical", input: { hand: [1, 2, 3, 6, 2, 3, 4, 7, 8], groupSize: 3 }, expected: true },
      { label: "Not possible", input: { hand: [1, 2, 3, 4, 5], groupSize: 4 }, expected: false },
    ],
  },
  1029: {
    no: 1029,
    code: `class Solution {
  twoCitySchedCost(costs) {
    const sorted = [...costs].sort((a, b) => a[0] - a[1] - (b[0] - b[1]));
    let total = 0;
    const half = sorted.length / 2;
    for (let i = 0; i < sorted.length; i++) {
      total += i < half ? sorted[i][0] : sorted[i][1];
    }
    return total;
  }
}`,
    input: { costs: [[10, 20], [30, 200], [400, 50], [30, 20]] },
    expected: 110,
    examples: [
      { label: "Edge: [[0,1]]", input: { costs: [[0, 1]] }, expected: 0 },
      { label: "Typical", input: { costs: [[10, 20], [30, 200], [400, 50], [30, 20]] }, expected: 110 },
      { label: "All cheap A", input: { costs: [[1, 1000], [2, 1000]] }, expected: 3 },
    ],
  },
  75: {
    no: 75,
    code: `class Solution {
  sortColors(nums) {
    let left = 0;
    let right = nums.length - 1;
    let i = 0;
    while (i <= right) {
      if (nums[i] === 0) {
        const temp = nums[left];
        nums[left] = nums[i];
        nums[i] = temp;
        left++;
        i++;
      } else if (nums[i] === 2) {
        const temp = nums[right];
        nums[right] = nums[i];
        nums[i] = temp;
        right--;
      } else {
        i++;
      }
    }
  }
}`,
    input: { nums: [2, 0, 2, 1, 1, 0] },
    expected: [0, 0, 1, 1, 2, 2],
    examples: [
      { label: "Edge: [0]", input: { nums: [0] }, expected: [[0]] },
      { label: "Classic", input: { nums: [2, 0, 2, 1, 1, 0] }, expected: [[0, 0, 1, 1, 2, 2]] },
      { label: "Two groups", input: { nums: [2, 0, 1] }, expected: [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]] },
    ],
  },
  179: {
    no: 179,
    code: `class Solution {
  largestNumber(nums) {
    const sorted = nums.map(String).sort((a, b) => (b + a).localeCompare(a + b));
    if (sorted[0] === "0") return "0";
    return sorted.join("");
  }
}`,
    input: { nums: [3, 30, 34, 5, 9] },
    expected: "9534330",
    examples: [
      { label: "Edge: ['0']", input: { nums: ["0"] }, expected: "0" },
      { label: "Typical", input: { nums: ["3", "30", "34", "5", "9"] }, expected: "9534330" },
      { label: "Equal prefix", input: { nums: ["10", "2"] }, expected: "210" },
    ],
  },

  // ── Intervals ────────────────────────────────────────────────────────────
  252: {
    no: 252,
    code: `class Solution {
  canAttendMeetings(intervals) {
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i][0] < sorted[i - 1][1]) return false;
    }
    return true;
  }
}`,
    input: { intervals: [[0, 30], [5, 10], [15, 20]] },
    expected: false,
    examples: [
      { label: "Edge: single", input: { intervals: [[7, 10]] }, expected: true },
      { label: "Overlap", input: { intervals: [[1, 3], [2, 6], [8, 10]] }, expected: false },
      { label: "No overlap", input: { intervals: [[1, 2], [3, 4]] }, expected: true },
    ],
  },
  253: {
    no: 253,
    code: `class Solution {
  minMeetingRooms(intervals) {
    const starts = intervals.map((i) => i[0]).sort((a, b) => a - b);
    const ends = intervals.map((i) => i[1]).sort((a, b) => a - b);
    let rooms = 0;
    let endIndex = 0;
    for (const start of starts) {
      if (start < ends[endIndex]) rooms++;
      else endIndex++;
    }
    return rooms;
  }
}`,
    input: { intervals: [[0, 30], [5, 10], [15, 20]] },
    expected: 2,
    examples: [
      { label: "Edge: single", input: { intervals: [[0, 30]] }, expected: 1 },
      { label: "Classic", input: { intervals: [[0, 30], [5, 10], [15, 20]] }, expected: 2 },
      { label: "All overlap", input: { intervals: [[1, 5], [2, 6], [3, 7]] }, expected: 3 },
    ],
  },
  435: {
    no: 435,
    code: `class Solution {
  eraseOverlapIntervals(intervals) {
    const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
    let keep = 0;
    let end = -Infinity;
    for (const [start, finish] of sorted) {
      if (start >= end) {
        keep++;
        end = finish;
      }
    }
    return intervals.length - keep;
  }
}`,
    input: { intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] },
    expected: 1,
    examples: [
      { label: "Edge: [[1,2]]", input: { intervals: [[1, 2]] }, expected: 0 },
      { label: "Classic", input: { intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] }, expected: 1 },
      { label: "All overlap", input: { intervals: [[1, 2], [1, 2], [1, 2]] }, expected: 2 },
    ],
  },
  1288: {
    no: 1288,
    code: `class Solution {
  removeCoveredIntervals(intervals) {
    const sorted = [...intervals].sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    let covered = 0;
    let maxEnd = -Infinity;
    for (const [start, end] of sorted) {
      if (end <= maxEnd) covered++;
      else maxEnd = end;
    }
    return intervals.length - covered;
  }
}`,
    input: { intervals: [[1, 4], [3, 6], [2, 8]] },
    expected: 2,
    examples: [
      { label: "Edge: [[1,1]]", input: { intervals: [[1, 1]] }, expected: 0 },
      { label: "Typical", input: { intervals: [[1, 4], [3, 4], [1, 3], [1, 5]] }, expected: 2 },
      { label: "Classic", input: { intervals: [[1, 2], [2, 3]] }, expected: 1 },
    ],
  },
  1094: {
    no: 1094,
    code: `class Solution {
  carPooling(trips, capacity) {
    const timeline = new Array(1001).fill(0);
    for (const [passengers, from, to] of trips) {
      timeline[from] += passengers;
      timeline[to] -= passengers;
    }
    let current = 0;
    for (const change of timeline) {
      current += change;
      if (current > capacity) return false;
    }
    return true;
  }
}`,
    input: { trips: [[2, 1, 5], [3, 3, 7]], capacity: 4 },
    expected: false,
    examples: [
      { label: "Edge: [[1]]", input: { trips: [[1, 1, 2]], capacity: 1 }, expected: true },
      { label: "Overload", input: { trips: [[2, 1, 5], [3, 3, 7]], capacity: 4 }, expected: false },
      { label: "Fits", input: { trips: [[2, 1, 5], [3, 3, 7]], capacity: 5 }, expected: true },
    ],
  },

  // ── Math & Geometry ──────────────────────────────────────────────────────
  7: {
    no: 7,
    code: `class Solution {
  reverse(x) {
    let result = 0;
    let value = Math.abs(x);
    while (value > 0) {
      result = result * 10 + (value % 10);
      value = Math.floor(value / 10);
    }
    const signed = x < 0 ? -result : result;
    if (signed > 2 ** 31 - 1 || signed < -(2 ** 31)) return 0;
    return signed;
  }
}`,
    input: { x: 123 },
    expected: 321,
    examples: [
      { label: "Edge: 0", input: { x: 0 }, expected: 0 },
      { label: "Typical", input: { x: 123 }, expected: 321 },
      { label: "Negative", input: { x: -123 }, expected: -321 },
    ],
  },
  43: {
    no: 43,
    code: `class Solution {
  multiply(num1, num2) {
    if (num1 === "0" || num2 === "0") return "0";
    const result = new Array(num1.length + num2.length).fill(0);
    for (let i = num1.length - 1; i >= 0; i--) {
      for (let j = num2.length - 1; j >= 0; j--) {
        const product = Number(num1[i]) * Number(num2[j]);
        const pos = i + j + 1;
        const sum = result[pos] + product;
        result[pos] = sum % 10;
        result[pos - 1] += Math.floor(sum / 10);
      }
    }
    while (result[0] === 0) result.shift();
    return result.join("");
  }
}`,
    input: { num1: "123", num2: "456" },
    expected: "56088",
    examples: [
      { label: "Edge: '0'", input: { num: "0" }, expected: "0" },
      { label: "Typical", input: { num: "123" }, expected: "56088" },
      { label: "Multi-digit", input: { num: "999" }, expected: "2997" },
    ],
  },
  118: {
    no: 118,
    code: `class Solution {
  generate(numRows) {
    const triangle = [];
    for (let row = 0; row < numRows; row++) {
      const current = new Array(row + 1).fill(1);
      for (let col = 1; col < row; col++) {
        current[col] = triangle[row - 1][col - 1] + triangle[row - 1][col];
      }
      triangle.push(current);
    }
    return triangle;
  }
}`,
    input: { numRows: 5 },
    expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]],
    examples: [
      { label: "Edge: 1", input: { numRows: 1 }, expected: [[1]] },
      { label: "Typical", input: { numRows: 5 }, expected: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]] },
      { label: "3 rows", input: { numRows: 3 }, expected: [[1], [1, 1], [1, 2, 1]] },
    ],
  },
  263: {
    no: 263,
    code: `class Solution {
  isUgly(n) {
    if (n <= 0) return false;
    for (const factor of [2, 3, 5]) {
      while (n % factor === 0) n = n / factor;
    }
    return n === 1;
  }
}`,
    input: { n: 6 },
    expected: true,
    examples: [
      { label: "Edge: 1", input: { n: 1 }, expected: true },
      { label: "Classic", input: { n: 14 }, expected: true },
      { label: "Not ugly", input: { n: -14 }, expected: false },
    ],
  },
  371: {
    no: 371,
    code: `class Solution {
  getSum(a, b) {
    while (b !== 0) {
      const carry = (a & b) << 1;
      a = a ^ b;
      b = carry;
    }
    return a;
  }
}`,
    input: { a: 1, b: 2 },
    expected: 3,
    examples: [
      { label: "Edge: 0+0", input: { a: 0, b: 0 }, expected: 0 },
      { label: "Typical", input: { a: 1, b: 2 }, expected: 3 },
      { label: "Negatives", input: { a: -1, b: -2 }, expected: -3 },
    ],
  },
  2028: {
    no: 2028,
    code: `class Solution {
  missingRolls(rolls, mean, n) {
    const total = mean * (rolls.length + n);
    let missing = total;
    for (const roll of rolls) missing -= roll;
    if (missing < n || missing > 6 * n) return [];
    const base = Math.floor(missing / n);
    const remainder = missing % n;
    const result = new Array(n).fill(base);
    for (let i = 0; i < remainder; i++) result[i]++;
    return result;
  }
}`,
    input: { rolls: [3, 2, 4, 3], mean: 4, n: 2 },
    expected: [6, 6],
    examples: [
      { label: "Edge: [1]", input: { rolls: [1], mean: 3, n: 1 }, expected: [6] },
      { label: "Classic", input: { rolls: [3, 2], mean: 4, n: 4 }, expected: [6, 6] },
      { label: "Impossible", input: { rolls: [1], mean: 3, n: 6 }, expected: [] },
    ],
  },
  1041: {
    no: 1041,
    code: `class Solution {
  isRobotBounded(instructions) {
    let x = 0;
    let y = 0;
    let direction = 0;
    const dx = [0, 1, 0, -1];
    const dy = [1, 0, -1, 0];
    for (const instruction of instructions) {
      if (instruction === "G") {
        x += dx[direction];
        y += dy[direction];
      } else if (instruction === "L") {
        direction = (direction + 3) % 4;
      } else {
        direction = (direction + 1) % 4;
      }
    }
    return (x === 0 && y === 0) || direction !== 0;
  }
}`,
    input: { instructions: "GGLLGG" },
    expected: true,
    examples: [
      { label: "Edge: 'R'", input: { instructions: "R" }, expected: [0, 0] },
      { label: "Classic", input: { instructions: "RRL" }, expected: [0, 0] },
      { label: "Spiral", input: { instructions: "GGLLGG" }, expected: [0, 0] },
    ],
  },
  // ── Additional NeetCode templates ────────────────────────────────────────
  724: {
    no: 724,
    code: `class Solution {
  pivotIndex(nums) {
    const total = nums.reduce((a, b) => a + b, 0);
    let left = 0;
    for (let i = 0; i < nums.length; i++) {
      if (left === total - left - nums[i]) return i;
      left += nums[i];
    }
    return -1;
  }
}`,
    input: {"nums":[1,7,3,6,5,6]},
    expected: 3,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 0 },
      { label: "Classic", input: { nums: [1, 7, 3, 6, 5, 6] }, expected: 3 },
      { label: "No pivot", input: { nums: [1, 2, 3] }, expected: -1 },
    ],
  },
  605: {
    no: 605,
    code: `class Solution {
  canPlaceFlowers(flowerbed, n) {
    let count = 0;
    for (let i = 0; i < flowerbed.length; i++) {
      if (flowerbed[i] === 0) {
        const leftOk = i === 0 || flowerbed[i - 1] === 0;
        const rightOk = i === flowerbed.length - 1 || flowerbed[i + 1] === 0;
        if (leftOk && rightOk) { flowerbed[i] = 1; count++; }
      }
    }
    return count >= n;
  }
}`,
    input: {"flowerbed":[1,0,0,0,1],"n":1},
    expected: true,
    examples: [
      { label: "Edge: [1]", input: { flowerbed: [1], n: 1 }, expected: false },
      { label: "Typical", input: { flowerbed: [1, 0, 0, 0, 1], n: 1 }, expected: true },
      { label: "Too many", input: { flowerbed: [1, 0, 0, 0, 1], n: 2 }, expected: false },
    ],
  },
  496: {
    no: 496,
    code: `class Solution {
  nextGreaterElement(nums1, nums2) {
    const map = new Map();
    const stack = [];
    for (const num of nums2) {
      while (stack.length && stack[stack.length - 1] < num) {
        map.set(stack.pop(), num);
      }
      stack.push(num);
    }
    return nums1.map(num => map.get(num) ?? -1);
  }
}`,
    input: {"nums1":[4,1,2],"nums2":[1,3,4,2]},
    expected: [-1,3,-1],
    examples: [
      { label: "Edge: [2,1]", input: { nums1: [2, 1], nums2: [1, 2] }, expected: [-1, 3] },
      { label: "Typical", input: { nums1: [4, 1, 2], nums2: [1, 3, 4, 2] }, expected: [-1, 3, -1] },
      { label: "Same order", input: { nums1: [2, 4], nums2: [1, 2, 3, 4] }, expected: [3, -1] },
    ],
  },
  96: {
    no: 96,
    code: `class Solution {
  numTrees(n) {
    const dp = new Array(n + 1).fill(0);
    dp[0] = 1;
    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < i; j++) {
        dp[i] += dp[j] * dp[i - 1 - j];
      }
    }
    return dp[n];
  }
}`,
    input: {"n":3},
    expected: 5,
    examples: [
      { label: "Edge: [1]", input: { n: 1 }, expected: 1 },
      { label: "Classic", input: { n: 3 }, expected: 5 },
      { label: "n=4", input: { n: 4 }, expected: 14 },
    ],
  },
  513: {
    no: 513,
    code: `class Solution {
  findBottomLeftValue(root) {
    const queue = [root];
    let result = root.val;
    while (queue.length) {
      const sz = queue.length;
      for (let i = 0; i < sz; i++) {
        const node = queue.shift();
        if (i === 0) result = node.val;
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }
    }
    return result;
  }
}`,
    input: {"root":[2,1,3]},
    expected: 1,
    examples: [
      { label: "Edge: [1]", input: { root: [1] }, expected: 1 },
      { label: "Typical", input: { root: [2, 1, 3] }, expected: 1 },
      { label: "Deeper left", input: { root: [1, 2, 3, 4, null, null, null, 5] }, expected: 5 },
    ],
  },
  669: {
    no: 669,
    code: `class Solution {
  trimBST(root, low, high) {
    if (!root) return null;
    if (root.val < low) return this.trimBST(root.right, low, high);
    if (root.val > high) return this.trimBST(root.left, low, high);
    root.left = this.trimBST(root.left, low, high);
    root.right = this.trimBST(root.right, low, high);
    return root;
  }
}`,
    input: {"root":[1,0,2],"low":1,"high":2},
    expected: [1,null,2],
    examples: [
      { label: "Edge: [1]", input: { root: [1], low: 1, high: 1 }, expected: [1] },
      { label: "Typical", input: { root: [1, 0, 2], low: 1, high: 2 }, expected: [1, 2] },
      { label: "Cut root", input: { root: [3, 0, 4, null, 2], low: 1, high: 3 }, expected: [3, 2] },
    ],
  },
  951: {
    no: 951,
    code: `class Solution {
  flipEquiv(root1, root2) {
    if (!root1 && !root2) return true;
    if (!root1 || !root2 || root1.val !== root2.val) return false;
    return (this.flipEquiv(root1.left, root2.left) && this.flipEquiv(root1.right, root2.right)) ||
           (this.flipEquiv(root1.left, root2.right) && this.flipEquiv(root1.right, root2.left));
  }
}`,
    input: {"root1":[1,2,3,4,5,6,null,null,null,7,8],"root2":[1,3,2,null,6,4,5,null,null,null,null,8,7]},
    expected: true,
    examples: [
      { label: "Edge: [1]+[1]", input: { root1: [1], root2: [1] }, expected: true },
      { label: "Typical", input: { root1: [1, 2, 3, 4, 5, 6], root2: [1, 3, 2, null, 6, 4, 5] }, expected: true },
      { label: "Different", input: { root1: [1, 2, 3], root2: [1, 2, 4] }, expected: false },
    ],
  },
  47: {
    no: 47,
    code: `class Solution {
  permuteUnique(nums) {
    nums.sort((a, b) => a - b);
    const result = [];
    const used = new Array(nums.length).fill(false);
    const backtrack = (current) => {
      if (current.length === nums.length) { result.push([...current]); return; }
      for (let i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;
        used[i] = true;
        current.push(nums[i]);
        backtrack(current);
        current.pop();
        used[i] = false;
      }
    };
    backtrack([]);
    return result;
  }
}`,
    input: {"nums":[1,1,2]},
    expected: [[1,1,2],[1,2,1],[2,1,1]],
    examples: [
      { label: "Edge: [[1]]", input: { nums: [[1]] }, expected: [[1]] },
      { label: "Classic", input: { nums: [[1, 2], [3, 4]] }, expected: [[1, 2], [3, 4], [1, 3], [1, 4], [2, 3], [2, 4]] },
      { label: "No dups", input: { nums: [[1]] }, expected: [[1]] },
    ],
  },
  343: {
    no: 343,
    code: `class Solution {
  integerBreak(n) {
    const dp = new Array(n + 1).fill(0);
    dp[1] = 1;
    for (let i = 2; i <= n; i++) {
      for (let j = 1; j < i; j++) {
        dp[i] = Math.max(dp[i], j * Math.max(i - j, dp[i - j]));
      }
    }
    return dp[n];
  }
}`,
    input: {"n":10},
    expected: 36,
    examples: [
      { label: "Edge: 2", input: { n: 2 }, expected: 1 },
      { label: "Typical", input: { n: 10 }, expected: 36 },
      { label: "n=5", input: { n: 5 }, expected: 6 },
    ],
  },
  377: {
    no: 377,
    code: `class Solution {
  combinationSum4(nums, target) {
    const dp = new Array(target + 1).fill(0);
    dp[0] = 1;
    for (let i = 1; i <= target; i++) {
      for (const num of nums) {
        if (num <= i) dp[i] += dp[i - num];
      }
    }
    return dp[target];
  }
}`,
    input: {"nums":[1,2,3],"target":4},
    expected: 7,
    examples: [
      { label: "Edge: [1]", input: { nums: [1], target: 1 }, expected: 1 },
      { label: "Typical", input: { nums: [1, 2, 3], target: 4 }, expected: 7 },
      { label: "Classic", input: { nums: [9], target: 3 }, expected: 0 },
    ],
  },
  494: {
    no: 494,
    code: `class Solution {
  findTargetSumWays(nums, target) {
    const total = nums.reduce((a, b) => a + b, 0);
    if ((total + target) % 2 || (total + target) < 0) return 0;
    const sum = (total + target) / 2;
    const dp = new Array(sum + 1).fill(0);
    dp[0] = 1;
    for (const num of nums) {
      for (let i = sum; i >= num; i--) dp[i] += dp[i - num];
    }
    return dp[sum];
  }
}`,
    input: {"nums":[1,1,1,1,1],"target":3},
    expected: 5,
    examples: [
      { label: "Edge: [1]", input: { nums: [1], target: 1 }, expected: 1 },
      { label: "Typical", input: { nums: [1, 1, 1, 1, 1], target: 3 }, expected: 5 },
      { label: "Classic", input: { nums: [1], target: 1 }, expected: 1 },
    ],
  },
  583: {
    no: 583,
    code: `class Solution {
  minDistance(word1, word2) {
    const m = word1.length, n = word2.length;
    const dp = Array.from({length: m + 1}, (_, i) => new Array(n + 1).fill(0).map((_, j) => i + j));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
        else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    return dp[m][n];
  }
}`,
    input: {"word1":"sea","word2":"eat"},
    expected: 2,
    examples: [
      { label: "Edge: empty", input: { word1: "", word2: "" }, expected: 0 },
      { label: "Typical", input: { word1: "sea", word2: "eat" }, expected: 2 },
      { label: "Same", input: { word1: "abc", word2: "abc" }, expected: 0 },
    ],
  },
  673: {
    no: 673,
    code: `class Solution {
  findNumberOfLIS(nums) {
    const n = nums.length;
    const len = new Array(n).fill(1);
    const count = new Array(n).fill(1);
    let maxLen = 1;
    for (let i = 1; i < n; i++) {
      for (let j = 0; j < i; j++) {
        if (nums[j] < nums[i]) {
          if (len[j] + 1 > len[i]) { len[i] = len[j] + 1; count[i] = count[j]; }
          else if (len[j] + 1 === len[i]) count[i] += count[j];
        }
      }
      maxLen = Math.max(maxLen, len[i]);
    }
    let result = 0;
    for (let i = 0; i < n; i++) if (len[i] === maxLen) result += count[i];
    return result;
  }
}`,
    input: {"nums":[1,3,5,4,7]},
    expected: 2,
    examples: [
      { label: "Edge: [1]", input: { nums: [1] }, expected: 1 },
      { label: "Classic", input: { nums: [1, 3, 5, 4, 7] }, expected: 2 },
      { label: "Strictly increasing", input: { nums: [1, 2, 3, 4, 5] }, expected: 5 },
    ],
  },
  931: {
    no: 931,
    code: `class Solution {
  minFallingPathSum(matrix) {
    const n = matrix.length;
    for (let i = 1; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let min = matrix[i - 1][j];
        if (j > 0) min = Math.min(min, matrix[i - 1][j - 1]);
        if (j < n - 1) min = Math.min(min, matrix[i - 1][j + 1]);
        matrix[i][j] += min;
      }
    }
    return Math.min(...matrix[n - 1]);
  }
}`,
    input: {"matrix":[[2,1,3],[6,5,4],[7,8,9]]},
    expected: 13,
    examples: [
      { label: "Edge: [[5]]", input: { nums: [[5]] }, expected: 0 },
      { label: "Classic", input: { nums: [[2, 1, 3], [6, 4, 5], [7, 8, 9]] }, expected: 13 },
      { label: "Single col", input: { nums: [[-19, 57], [-40, -5]] }, expected: -45 },
    ],
  },
  1312: {
    no: 1312,
    code: `class Solution {
  minInsertions(s) {
    const n = s.length;
    const dp = Array.from({length: n}, () => new Array(n).fill(0));
    for (let len = 2; len <= n; len++) {
      for (let i = 0; i <= n - len; i++) {
        const j = i + len - 1;
        if (s[i] === s[j]) dp[i][j] = dp[i + 1][j - 1];
        else dp[i][j] = 1 + Math.min(dp[i + 1][j], dp[i][j - 1]);
      }
    }
    return dp[0][n - 1];
  }
}`,
    input: {"s":"zzazz"},
    expected: 0,
    examples: [
      { label: "Edge: 'a'", input: { s: "a" }, expected: 0 },
      { label: "Classic", input: { s: "abbbba" }, expected: 1 },
      { label: "Long", input: { s: "leetcode" }, expected: 5 },
    ],
  },
  1911: {
    no: 1911,
    code: `class Solution {
  maxAlternatingSum(nums) {
    let odd = 0, even = 0;
    for (const num of nums) {
      even = Math.max(even, odd - num);
      odd = Math.max(odd, even + num);
    }
    return odd;
  }
}`,
    input: {"nums":[4,2,5,3]},
    expected: 7,
    examples: [
      { label: "Edge: [1,1]", input: { nums: [1, 1] }, expected: 2 },
      { label: "Typical", input: { nums: [1, 2, 3] }, expected: 6 },
      { label: "Classic", input: { nums: [6, 4, 4, 6] }, expected: 4 },
    ],
  },
  1921: {
    no: 1921,
    code: `class Solution {
  eliminateMaximum(dist, speed) {
    const times = dist.map((d, i) => d / speed[i]).sort((a, b) => a - b);
    for (let i = 0; i < times.length; i++) {
      if (times[i] <= i) return i;
    }
    return times.length;
  }
}`,
    input: {"dist":[4,2,3],"speed":[2,1,1]},
    expected: 3,
    examples: [
      { label: "Edge: [1]", input: { dist: [1], speed: [1], fuel: [1], cost: [1] }, expected: 1 },
      { label: "Classic", input: { dist: [3, 2, 4], speed: [4, 2, 3], fuel: [4, 2, 9], cost: [1, 1, 1] }, expected: 2 },
      { label: "All possible", input: { dist: [1, 3, 5, 7, 9], speed: [2, 4, 6, 8, 10], fuel: [10, 10, 10, 10, 10], cost: [1, 1, 1, 1, 1] }, expected: 5 },
    ],
  },
  1046: {
    no: 1046,
    code: `class Solution {
  lastStoneWeight(stones) {
    stones.sort((a, b) => b - a);
    while (stones.length > 1) {
      const a = stones.shift(), b = stones.shift();
      if (a !== b) { stones.push(a - b); stones.sort((x, y) => y - x); }
    }
    return stones[0] || 0;
  }
}`,
    input: {"stones":[2,7,4,1,8,1]},
    expected: 1,
    examples: [
      { label: "Edge: [2,7,2]", input: { stones: [2, 7, 2] }, expected: 1 },
      { label: "Classic", input: { stones: [2, 3, 6, 6, 7, 7, 8, 10, 11] }, expected: 2 },
      { label: "All equal", input: { stones: [5, 5] }, expected: 0 },
    ],
  },
  1048: {
    no: 1048,
    code: `class Solution {
  longestStrChain(words) {
    words.sort((a, b) => a.length - b.length);
    const dp = new Map();
    let best = 1;
    for (const word of words) {
      dp.set(word, 1);
      for (let i = 0; i < word.length; i++) {
        const prev = word.slice(0, i) + word.slice(i + 1);
        if (dp.has(prev)) { dp.set(word, Math.max(dp.get(word), dp.get(prev) + 1)); best = Math.max(best, dp.get(word)); }
      }
    }
    return best;
  }
}`,
    input: {"words":["a","b","ba","bca","bda","bdca"]},
    expected: 4,
    examples: [
      { label: "Edge: [a]", input: { words: ["a"] }, expected: 1 },
      { label: "Typical", input: { words: ["a", "b", "ba", "bca", "bda", "bdca"] }, expected: 4 },
      { label: "Classic", input: { words: ["abc", "abcd", "ab", "a"] }, expected: 4 },
    ],
  },
  1461: {
    no: 1461,
    code: `class Solution {
  hasAllCodes(s, k) {
    const total = 1 << k;
    const seen = new Set();
    for (let i = 0; i <= s.length - k; i++) seen.add(s.slice(i, i + k));
    return seen.size === total;
  }
}`,
    input: {"s":"00110110","k":2},
    expected: true,
    examples: [
      { label: "Edge: 'a',k=1", input: { s: "a", k: 1 }, expected: true },
      { label: "Classic", input: { s: "abc", k: 3 }, expected: true },
      { label: "Missing", input: { s: "abac", k: 2 }, expected: false },
    ],
  },
  1498: {
    no: 1498,
    code: `class Solution {
  numSubseq(nums, target) {
    const MOD = 1e9 + 7;
    nums.sort((a, b) => a - b);
    let result = 0;
    const pow2 = new Array(nums.length).fill(1);
    for (let i = 1; i < nums.length; i++) pow2[i] = (pow2[i - 1] * 2) % MOD;
    let left = 0, right = nums.length - 1;
    while (left <= right) {
      if (nums[left] + nums[right] <= target) { result = (result + pow2[right - left]) % MOD; left++; }
      else right--;
    }
    return result;
  }
}`,
    input: {"nums":[3,5,6,7],"target":9},
    expected: 4,
    examples: [
      { label: "Edge: [1]", input: { nums: [1], target: 1 }, expected: 1 },
      { label: "Typical", input: { nums: [2, 3, 3, 2, 5], target: 9 }, expected: 6 },
      { label: "Classic", input: { nums: [2, 3, 4, 2], target: 6 }, expected: 8 },
    ],
  },
  287: {
    no: 287,
    code: `class Solution {
  findDuplicate(nums) {
    let slow = nums[0], fast = nums[0];
    while (true) {
      slow = nums[slow];
      fast = nums[nums[fast]];
      if (slow === fast) break;
    }
    slow = nums[0];
    while (slow !== fast) { slow = nums[slow]; fast = nums[fast]; }
    return slow;
  }
}`,
    input: {"nums":[1,3,4,2,2]},
    expected: 2,
    examples: [
      { label: "Edge: [1,1]", input: { nums: [1, 1] }, expected: 1 },
      { label: "Classic", input: { nums: [1, 3, 4, 2, 2] }, expected: 2 },
      { label: "Long", input: { nums: [3, 1, 3, 4, 2] }, expected: 3 },
    ],
  },
  684: {
    no: 684,
    code: `class Solution {
  findRedundantConnection(edges) {
    const parent = Array.from({length: edges.length + 1}, (_, i) => i);
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    for (const [a, b] of edges) {
      if (find(a) === find(b)) return [a, b];
      parent[find(a)] = find(b);
    }
    return [];
  }
}`,
    input: {"edges":[[1,2],[1,3],[2,3]]},
    expected: [2,3],
    examples: [
      { label: "Edge: [[1,1]]", input: { edges: [[1, 1]] }, expected: [1, 1] },
      { label: "Typical", input: { edges: [[1, 2], [1, 3], [2, 3]] }, expected: [2, 3] },
      { label: "No cycle", input: { edges: [[1, 2], [3, 4]] }, expected: [] },
    ],
  },
  286: {
    no: 286,
    code: `class Solution {
  wallsAndGates(rooms) {
    const queue = [];
    for (let r = 0; r < rooms.length; r++) {
      for (let c = 0; c < rooms[0].length; c++) {
        if (rooms[r][c] === 0) queue.push([r, c, 0]);
      }
    }
    while (queue.length) {
      const [r, c, d] = queue.shift();
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rooms.length && nc >= 0 && nc < rooms[0].length && rooms[nr][nc] === 2147483647) {
          rooms[nr][nc] = d + 1;
          queue.push([nr, nc, d + 1]);
        }
      }
    }
  }
}`,
    input: {"rooms":[[2147483647,-1,0,2147483647],[2147483647,2147483647,2147483647,-1],[2147483647,-1,2147483647,-1],[0,-1,2147483647,2147483647]]},
    expected: [[3,-1,0,1],[2,2,1,-1],[1,-1,2,-1],[0,-1,3,4]],
    examples: [
      { label: "Edge: [[1]]", input: { rooms: [[1]] }, expected: [1] },
      { label: "Classic", input: { rooms: [[1, 3], [3, 0, 1], [2], [0]] }, expected: [1, 2, 1, 0] },
      { label: "Unreachable", input: { rooms: [[1], [2], [3], []] }, expected: [1, 1, 1, -1] },
    ],
  },
  417: {
    no: 417,
    code: `class Solution {
  pacificAtlantic(heights) {
    const m = heights.length, n = heights[0].length;
    const pac = Array.from({length: m}, () => new Array(n).fill(false));
    const atl = Array.from({length: m}, () => new Array(n).fill(false));
    const dfs = (r, c, visited, prev) => {
      if (r < 0 || r >= m || c < 0 || c >= n || visited[r][c] || heights[r][c] < prev) return;
      visited[r][c] = true;
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) dfs(r + dr, c + dc, visited, heights[r][c]);
    };
    for (let i = 0; i < m; i++) { dfs(i, 0, pac, -Infinity); dfs(i, n - 1, atl, -Infinity); }
    for (let j = 0; j < n; j++) { dfs(0, j, pac, -Infinity); dfs(m - 1, j, atl, -Infinity); }
    const result = [];
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (pac[r][c] && atl[r][c]) result.push([r, c]);
    return result;
  }
}`,
    input: {"heights":[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]},
    expected: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]],
    examples: [
      { label: "Edge: [[1]]", input: { heights: [[1]] }, expected: [[0, 0]] },
      { label: "Classic", input: { heights: [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]] }, expected: [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]] },
      { label: "All same", input: { heights: [[5, 5], [5, 5]] }, expected: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    ],
  },
  695: {
    no: 695,
    code: `class Solution {
  maxAreaOfIsland(grid) {
    let best = 0;
    const dfs = (r, c) => {
      if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] === 0) return 0;
      grid[r][c] = 0;
      return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1);
    };
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c] === 1) best = Math.max(best, dfs(r, c));
      }
    }
    return best;
  }
}`,
    input: {"grid":[[0,0,1,0,0],[0,1,1,0,0],[0,0,0,1,1],[0,0,0,0,0],[0,0,0,0,1]]},
    expected: 3,
    examples: [
      { label: "Edge: [[1]]", input: { grid: [[1]] }, expected: 1 },
      { label: "Classic", input: { grid: [[0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]] }, expected: 6 },
      { label: "All zeros", input: { grid: [[0, 0], [0, 0]] }, expected: 0 },
    ],
  },
  329: {
    no: 329,
    code: `class Solution {
  longestIncreasingPath(matrix) {
    const m = matrix.length, n = matrix[0].length;
    const memo = Array.from({length: m}, () => new Array(n).fill(0));
    const dfs = (r, c, prev) => {
      if (r < 0 || r >= m || c < 0 || c >= n || matrix[r][c] <= prev) return 0;
      if (memo[r][c]) return memo[r][c];
      let best = 0;
      for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        best = Math.max(best, dfs(r + dr, c + dc, matrix[r][c]) + 1);
      }
      memo[r][c] = best;
      return best;
    };
    let result = 0;
    for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) result = Math.max(result, dfs(r, c, -Infinity));
    return result;
  }
}`,
    input: {"matrix":[[9,9,4],[6,6,8],[2,1,1]]},
    expected: 4,
    examples: [
      { label: "Edge: [[1]]", input: { matrix: [[1]] }, expected: 1 },
      { label: "Classic", input: { matrix: [[9, 9, 4], [6, 6, 8], [2, 1, 1]] }, expected: 4 },
      { label: "All same", input: { matrix: [[3, 3], [3, 3]] }, expected: 1 },
    ],
  },
  1091: {
    no: 1091,
    code: `class Solution {
  shortestPathBinaryMatrix(grid) {
    if (grid[0][0] || grid[grid.length - 1][grid[0].length - 1]) return -1;
    const n = grid.length;
    const queue = [[0, 0, 1]];
    grid[0][0] = 1;
    while (queue.length) {
      const [r, c, d] = queue.shift();
      if (r === n - 1 && c === n - 1) return d;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0) {
            grid[nr][nc] = 1;
            queue.push([nr, nc, d + 1]);
          }
        }
      }
    }
    return -1;
  }
}`,
    input: {"grid":[[0,1],[1,0]]},
    expected: 2,
    examples: [
      { label: "Edge: [[0]]", input: { grid: [[0]] }, expected: 0 },
      { label: "Classic", input: { grid: [[0, 0, 0], [1, 1, 0], [1, 1, 0]] }, expected: 4 },
      { label: "No path", input: { grid: [[0, 1], [1, 0]] }, expected: -1 },
    ],
  },
  463: {
    no: 463,
    code: `class Solution {
  islandPerimeter(grid) {
    let perimeter = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c] === 1) {
          perimeter += 4;
          if (r > 0 && grid[r - 1][c] === 1) perimeter -= 2;
          if (c > 0 && grid[r][c - 1] === 1) perimeter -= 2;
        }
      }
    }
    return perimeter;
  }
}`,
    input: {"grid":[[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]},
    expected: 16,
    examples: [
      { label: "Edge: [[1]]", input: { grid: [[1]] }, expected: 4 },
      { label: "Classic", input: { grid: [[1, 0]] }, expected: 4 },
      { label: "Square", input: { grid: [[1, 1], [1, 0]] }, expected: 8 },
    ],
  },
  973: {
    no: 973,
    code: `class Solution {
  kClosest(points, k) {
    return points.sort((a, b) => (a[0] ** 2 + a[1] ** 2) - (b[0] ** 2 + b[1] ** 2)).slice(0, k);
  }
}`,
    input: {"points":[[3,3],[5,-1],[-2,4]],"k":2},
    expected: [[3,3],[-2,4]],
    examples: [
      { label: "Edge: [[0,0]]", input: { points: [[0, 0]], k: 1 }, expected: [[0, 0]] },
      { label: "Classic", input: { points: [[1, 3], [-2, 2]], k: 1 }, expected: [[-2, 2]] },
      { label: "Tie", input: { points: [[3, 3], [5, -1], [-2, 4]], k: 2 }, expected: [[3, 3], [-2, 4]] },
    ],
  },
  1584: {
    no: 1584,
    code: `class Solution {
  minCostConnectPoints(points) {
    const n = points.length;
    const visited = new Set([0]);
    const minDist = new Array(n).fill(Infinity);
    for (let i = 1; i < n; i++) minDist[i] = Math.abs(points[0][0] - points[i][0]) + Math.abs(points[0][1] - points[i][1]);
    let result = 0;
    while (visited.size < n) {
      let bestNode = -1, bestDist = Infinity;
      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && minDist[i] < bestDist) { bestDist = minDist[i]; bestNode = i; }
      }
      visited.add(bestNode);
      result += bestDist;
      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          const dist = Math.abs(points[bestNode][0] - points[i][0]) + Math.abs(points[bestNode][1] - points[i][1]);
          minDist[i] = Math.min(minDist[i], dist);
        }
      }
    }
    return result;
  }
}`,
    input: {"points":[[0,0],[2,2],[3,10],[5,2],[7,0]]},
    expected: 20,
    examples: [
      { label: "Edge: [[0,0]]", input: { points: [[0, 0]] }, expected: 0 },
      { label: "Classic", input: { points: [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]] }, expected: 20 },
      { label: "Triangle", input: { points: [[3, 12], [-2, 5], [-4, 1]] }, expected: 18 },
    ],
  },

};

/** Resolve a deep-link id back to a NeetCode template (ids share the top150-<no> scheme). */
export function neetcodeTemplateFromId(id: string): NeetCodeTemplate | undefined {
  const match = /^top150-(\d+)$/.exec(id);
  if (!match) return undefined;
  return neetcodeTemplates[Number(match[1])];
}

/** True when the problem has a verified NeetCode template. */
export function hasNeetCodeTemplate(no: number): boolean {
  return neetcodeTemplates[no] !== undefined;
}

export type NeetCodeSolutionLanguage = "javascript" | "typescript" | "python" | "java" | "cpp";

/** Resolves the code for a question in the given language and variant. */
export function neetcodeCodeFor(
  no: number,
  language: NeetCodeSolutionLanguage,
  variant: "optimal" | "brute" = "optimal",
): string | undefined {
  const template = neetcodeTemplates[no];
  if (!template) return undefined;
  // NeetCode templates don't have brute variants yet.
  if (variant === "brute") return undefined;
  if (language === "javascript") return template.code;
  const ml = neetcodeMultiLang[no];
  if (!ml) return undefined;
  if (language === "python") return ml.pythonCode;
  if (language === "typescript") return ml.typescriptCode;
  if (language === "java") return ml.javaCode;
  if (language === "cpp") return ml.cppCode;
  return undefined;
}

/** Languages with an actual solution for this question. */
export function neetcodeLanguagesFor(no: number): NeetCodeSolutionLanguage[] {
  const languages: NeetCodeSolutionLanguage[] = ["javascript"];
  const ml = neetcodeMultiLang[no];
  if (ml?.pythonCode) languages.push("python");
  if (ml?.typescriptCode) languages.push("typescript");
  if (ml?.javaCode) languages.push("java");
  if (ml?.cppCode) languages.push("cpp");
  return languages;
}

/** Build an AlgorithmTemplate from a NeetCode entry for the visualizer. */
export function neetcodeTemplateAsAlgorithmTemplate(
  no: number,
  title: string,
  topicTitle: string,
  code: string,
): AlgorithmTemplate {
  const template = neetcodeTemplates[no];
  const ml = neetcodeMultiLang[no];
  const languages: Partial<Record<string, string>> = { javascript: template?.code ?? code };
  if (ml?.pythonCode) languages.python = ml.pythonCode;
  if (ml?.typescriptCode) languages.typescript = ml.typescriptCode;
  if (ml?.javaCode) languages.java = ml.javaCode;
  if (ml?.cppCode) languages.cpp = ml.cppCode;
  return {
    id: `top150-${no}`,
    name: title,
    category: topicTitle,
    code,
    input: template?.input ?? {},
    examples: template?.examples ?? [],
    languages,
  };
}

// ---------------------------------------------------------------------------
// Unified code resolution
// ---------------------------------------------------------------------------

/**
 * Coerce a raw language string to `SolutionLanguage`, defaulting to
 * "javascript" for anything the enum doesn't cover.
 */
export function normalizeLanguage(lang: string): SolutionLanguage {
  return lang === "python" || lang === "typescript" || lang === "java" || lang === "cpp"
    ? lang
    : "javascript";
}

/**
 * Resolve the code for a question across all registries (Top 150 → NeetCode →
 * built-in AlgorithmTemplate → fallback), with language normalization.
 *
 * @param no          LeetCode problem number (0 if not an external template).
 * @param language    Target language (raw or normalized — normalization happens inside).
 * @param variant     "optimal" or "brute".
 * @param builtin     Optional built-in AlgorithmTemplate (for non-external templates).
 * @param fallback    Last-resort code when nothing else matches.
 */
export function resolveExternalCode(
  no: number,
  language: string,
  variant: "optimal" | "brute",
  builtin?: AlgorithmTemplate,
  fallback?: string,
): string | undefined {
  const lang = normalizeLanguage(language);
  if (no) {
    return top150CodeFor(no, lang, variant) ?? neetcodeCodeFor(no, lang, variant);
  }
  if (builtin) {
    return templateCodeFor(builtin, lang, variant);
  }
  return fallback;
}

/**
 * Resolve languages available for an external question (Top 150 or NeetCode).
 * Returns undefined for non-external (built-in) templates.
 */
export function resolveExternalLanguages(
  no: number,
  builtin?: AlgorithmTemplate,
): SolutionLanguage[] | undefined {
  if (!no) return builtin ? templateLanguagesFor(builtin) : undefined;
  const top150Langs = top150LanguagesFor(no);
  if (top150Langs.length > 1) return top150Langs;
  return neetcodeLanguagesFor(no);
}

/** Check if a brute variant exists for the given question/template. */
export function hasBruteVariant(
  no: number,
  language: string,
  builtin?: AlgorithmTemplate,
): boolean {
  return resolveExternalCode(no, language, "brute", builtin) !== undefined;
}
