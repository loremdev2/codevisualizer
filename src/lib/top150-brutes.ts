// ---------------------------------------------------------------------------
// Brute-force variants for the Top Interview 150 bank.
//
// Each entry is a deliberately naive but CORRECT solution for the same
// LeetCode-format problem as the optimal template in top150-templates.ts
// (same `class Solution` + method + parameter names, so the auto-detected
// harness maps the input identically). The visualizer's Brute/Optimal toggle
// swaps between these and the canonical solutions, and every entry here is
// traced and result-verified in top150-templates.test.ts.
//
// Brute forces are included where a genuinely different, naive approach
// exists. For problems whose only sensible solution IS the standard one
// (design problems, BFS/DFS problems, backtracking where the naive IS the
// algorithm), no brute is registered — the toggle simply shows "Optimal".
// ---------------------------------------------------------------------------

/** Brute-force solution per problem number; absent key = optimal-only. */
export const top150Brutes: Partial<Record<number, string>> = {
  // ── Array / String ───────────────────────────────────────────────────────
  88: `class Solution {
  merge(nums1, m, nums2, n) {
    const merged = nums1.slice(0, m).concat(nums2.slice(0, n)).sort((a, b) => a - b);
    for (let i = 0; i < merged.length; i++) nums1[i] = merged[i];
  }
}`,
  27: `class Solution {
  removeElement(nums, val) {
    const kept = nums.filter((num) => num !== val);
    for (let i = 0; i < kept.length; i++) nums[i] = kept[i];
    return kept.length;
  }
}`,
  26: `class Solution {
  removeDuplicates(nums) {
    const seen = new Set();
    const kept = [];
    for (const num of nums) {
      if (!seen.has(num)) {
        seen.add(num);
        kept.push(num);
      }
    }
    for (let i = 0; i < kept.length; i++) nums[i] = kept[i];
    return kept.length;
  }
}`,
  80: `class Solution {
  removeDuplicates(nums) {
    const counts = new Map();
    const kept = [];
    for (const num of nums) {
      const count = counts.get(num) ?? 0;
      if (count < 2) {
        counts.set(num, count + 1);
        kept.push(num);
      }
    }
    for (let i = 0; i < kept.length; i++) nums[i] = kept[i];
    return kept.length;
  }
}`,
  169: `class Solution {
  majorityElement(nums) {
    const counts = new Map();
    for (const num of nums) counts.set(num, (counts.get(num) ?? 0) + 1);
    for (const [num, count] of counts) {
      if (count > nums.length / 2) return num;
    }
  }
}`,
  189: `class Solution {
  rotate(nums, k) {
    const steps = k % nums.length;
    for (let i = 0; i < steps; i++) {
      nums.unshift(nums.pop());
    }
  }
}`,
  121: `class Solution {
  maxProfit(prices) {
    let best = 0;
    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        best = Math.max(best, prices[j] - prices[i]);
      }
    }
    return best;
  }
}`,
  55: `class Solution {
  canJump(nums) {
    const can = (index) => {
      if (index >= nums.length - 1) return true;
      for (let jump = 1; jump <= nums[index]; jump++) {
        if (can(index + jump)) return true;
      }
      return false;
    };
    return can(0);
  }
}`,
  45: `class Solution {
  jump(nums) {
    const minJumps = (index) => {
      if (index >= nums.length - 1) return 0;
      let best = Infinity;
      for (let jump = 1; jump <= nums[index]; jump++) {
        best = Math.min(best, 1 + minJumps(index + jump));
      }
      return best;
    };
    return minJumps(0);
  }
}`,
  274: `class Solution {
  hIndex(citations) {
    citations.sort((a, b) => b - a);
    let h = 0;
    for (let i = 0; i < citations.length; i++) {
      if (citations[i] >= i + 1) h = i + 1;
      else break;
    }
    return h;
  }
}`,
  238: `class Solution {
  productExceptSelf(nums) {
    const result = [];
    for (let i = 0; i < nums.length; i++) {
      let product = 1;
      for (let j = 0; j < nums.length; j++) {
        if (j !== i) product *= nums[j];
      }
      result.push(product);
    }
    return result;
  }
}`,
  134: `class Solution {
  canCompleteCircuit(gas, cost) {
    const n = gas.length;
    for (let start = 0; start < n; start++) {
      let tank = 0;
      let ok = true;
      for (let steps = 0; steps < n; steps++) {
        const index = (start + steps) % n;
        tank += gas[index] - cost[index];
        if (tank < 0) {
          ok = false;
          break;
        }
      }
      if (ok) return start;
    }
    return -1;
  }
}`,
  42: `class Solution {
  trap(height) {
    let total = 0;
    for (let i = 0; i < height.length; i++) {
      let leftMax = 0;
      let rightMax = 0;
      for (let l = 0; l <= i; l++) leftMax = Math.max(leftMax, height[l]);
      for (let r = i; r < height.length; r++) rightMax = Math.max(rightMax, height[r]);
      total += Math.min(leftMax, rightMax) - height[i];
    }
    return total;
  }
}`,
  13: `class Solution {
  romanToInt(s) {
    const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    const sub = { IV: 4, IX: 9, XL: 40, XC: 90, CD: 400, CM: 900 };
    let total = 0;
    for (let i = 0; i < s.length; i++) {
      const pair = s.slice(i, i + 2);
      if (sub[pair]) {
        total += sub[pair];
        i++;
      } else {
        total += map[s[i]];
      }
    }
    return total;
  }
}`,

  // ── Two Pointers ────────────────────────────────────────────────────────
  125: `class Solution {
  isPalindrome(s) {
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleaned === cleaned.split("").reverse().join("");
  }
}`,
  167: `class Solution {
  twoSum(numbers, target) {
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        if (numbers[i] + numbers[j] === target) return [i + 1, j + 1];
      }
    }
  }
}`,
  11: `class Solution {
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
  15: `class Solution {
  threeSum(nums) {
    nums.sort((a, b) => a - b);
    const result = [];
    const seen = new Set();
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        for (let k = j + 1; k < nums.length; k++) {
          if (nums[i] + nums[j] + nums[k] === 0) {
            const key = nums[i] + "," + nums[j] + "," + nums[k];
            if (!seen.has(key)) {
              seen.add(key);
              result.push([nums[i], nums[j], nums[k]]);
            }
          }
        }
      }
    }
    return result;
  }
}`,

  // ── Sliding Window ──────────────────────────────────────────────────────
  209: `class Solution {
  minSubArrayLen(target, nums) {
    let best = Infinity;
    for (let i = 0; i < nums.length; i++) {
      let sum = 0;
      for (let j = i; j < nums.length; j++) {
        sum += nums[j];
        if (sum >= target) {
          best = Math.min(best, j - i + 1);
          break;
        }
      }
    }
    return best === Infinity ? 0 : best;
  }
}`,
  3: `class Solution {
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
  76: `class Solution {
  minWindow(s, t) {
    let best = "";
    for (let i = 0; i < s.length; i++) {
      for (let j = i; j < s.length; j++) {
        const window = s.slice(i, j + 1);
        if (window.length >= t.length && this.containsAll(window, t)) {
          if (best === "" || window.length < best.length) best = window;
        }
      }
    }
    return best;
  }
  containsAll(window, t) {
    const counts = new Map();
    for (const ch of window) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    for (const ch of t) {
      const remaining = (counts.get(ch) ?? 0) - 1;
      if (remaining < 0) return false;
      counts.set(ch, remaining);
    }
    return true;
  }
}`,

  // ── Matrix ──────────────────────────────────────────────────────────────
  48: `class Solution {
  rotate(matrix) {
    const n = matrix.length;
    const copy = matrix.map((row) => row.slice());
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        matrix[c][n - 1 - r] = copy[r][c];
      }
    }
  }
}`,
  73: `class Solution {
  setZeroes(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const copy = matrix.map((row) => row.slice());
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (copy[r][c] === 0) {
          for (let rr = 0; rr < rows; rr++) matrix[rr][c] = 0;
          for (let cc = 0; cc < cols; cc++) matrix[r][cc] = 0;
        }
      }
    }
  }
}`,

  // ── Hashmap ─────────────────────────────────────────────────────────────
  383: `class Solution {
  canConstruct(ransomNote, magazine) {
    const letters = magazine.split("");
    for (const ch of ransomNote) {
      const index = letters.indexOf(ch);
      if (index === -1) return false;
      letters.splice(index, 1);
    }
    return true;
  }
}`,
  242: `class Solution {
  isAnagram(s, t) {
    return s.split("").sort().join("") === t.split("").sort().join("");
  }
}`,
  49: `class Solution {
  groupAnagrams(strs) {
    const groups = [];
    for (const word of strs) {
      const key = word.split("").sort().join("");
      let placed = false;
      for (const group of groups) {
        if (group[0] === key) {
          group[1].push(word);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([key, [word]]);
    }
    return groups.map((group) => group[1]);
  }
}`,
  1: `class Solution {
  twoSum(nums, target) {
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] === target) return [i, j];
      }
    }
  }
}`,
  219: `class Solution {
  containsNearbyDuplicate(nums, k) {
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j <= i + k && j < nums.length; j++) {
        if (nums[i] === nums[j]) return true;
      }
    }
    return false;
  }
}`,
  128: `class Solution {
  longestConsecutive(nums) {
    if (nums.length === 0) return 0;
    const sorted = [...nums].sort((a, b) => a - b);
    let best = 1;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1]) continue;
      if (sorted[i] === sorted[i - 1] + 1) {
        streak++;
        best = Math.max(best, streak);
      } else {
        streak = 1;
      }
    }
    return best;
  }
}`,

  // ── Stack ───────────────────────────────────────────────────────────────
  20: `class Solution {
  isValid(s) {
    let previous = "";
    let current = s;
    const pairs = "()[]{}";
    while (current !== previous) {
      previous = current;
      for (let i = 0; i < pairs.length; i += 2) {
        current = current.split(pairs.slice(i, i + 2)).join("");
      }
    }
    return current === "";
  }
}`,

  // ── Linked List ─────────────────────────────────────────────────────────
  21: `class Solution {
  mergeTwoLists(l1, l2) {
    const values = [];
    const collect = (node) => {
      while (node !== null) {
        values.push(node.val);
        node = node.next;
      }
    };
    collect(l1);
    collect(l2);
    values.sort((a, b) => a - b);
    const dummy = new ListNode(0);
    let tail = dummy;
    for (const value of values) {
      tail.next = new ListNode(value);
      tail = tail.next;
    }
    return dummy.next;
  }
}`,
  19: `class Solution {
  removeNthFromEnd(head, n) {
    let length = 0;
    let node = head;
    while (node !== null) {
      length++;
      node = node.next;
    }
    const dummy = new ListNode(0, head);
    let previous = dummy;
    for (let i = 0; i < length - n; i++) previous = previous.next;
    previous.next = previous.next.next;
    return dummy.next;
  }
}`,
  82: `class Solution {
  deleteDuplicates(head) {
    const counts = new Map();
    let node = head;
    while (node !== null) {
      counts.set(node.val, (counts.get(node.val) ?? 0) + 1);
      node = node.next;
    }
    const dummy = new ListNode(0);
    let tail = dummy;
    node = head;
    while (node !== null) {
      if (counts.get(node.val) === 1) {
        tail.next = new ListNode(node.val);
        tail = tail.next;
      }
      node = node.next;
    }
    return dummy.next;
  }
}`,
  61: `class Solution {
  rotateRight(head, k) {
    const values = [];
    let node = head;
    while (node !== null) {
      values.push(node.val);
      node = node.next;
    }
    if (values.length === 0) return null;
    const steps = k % values.length;
    const rotated = values.slice(values.length - steps).concat(values.slice(0, values.length - steps));
    const dummy = new ListNode(0);
    let tail = dummy;
    for (const value of rotated) {
      tail.next = new ListNode(value);
      tail = tail.next;
    }
    return dummy.next;
  }
}`,
  86: `class Solution {
  partition(head, x) {
    const less = [];
    const greaterOrEqual = [];
    let node = head;
    while (node !== null) {
      if (node.val < x) less.push(node.val);
      else greaterOrEqual.push(node.val);
      node = node.next;
    }
    const values = less.concat(greaterOrEqual);
    const dummy = new ListNode(0);
    let tail = dummy;
    for (const value of values) {
      tail.next = new ListNode(value);
      tail = tail.next;
    }
    return dummy.next;
  }
}`,
  92: `class Solution {
  reverseBetween(head, left, right) {
    const values = [];
    let node = head;
    while (node !== null) {
      values.push(node.val);
      node = node.next;
    }
    const segment = values.slice(left - 1, right).reverse();
    const result = values.slice(0, left - 1).concat(segment, values.slice(right));
    const dummy = new ListNode(0);
    let tail = dummy;
    for (const value of result) {
      tail.next = new ListNode(value);
      tail = tail.next;
    }
    return dummy.next;
  }
}`,

  // ── Trees ───────────────────────────────────────────────────────────────
  100: `class Solution {
  isSameTree(p, q) {
    const serialize = (node, out) => {
      if (node === null) {
        out.push(null);
        return;
      }
      out.push(node.val);
      serialize(node.left, out);
      serialize(node.right, out);
    };
    const a = [];
    const b = [];
    serialize(p, a);
    serialize(q, b);
    return JSON.stringify(a) === JSON.stringify(b);
  }
}`,
  101: `class Solution {
  isSymmetric(root) {
    let level = [root];
    while (level.length > 0) {
      const values = level.map((node) => (node === null ? null : node.val));
      for (let i = 0; i < values.length / 2; i++) {
        if (values[i] !== values[values.length - 1 - i]) return false;
      }
      const next = [];
      for (const node of level) {
        if (node !== null) {
          next.push(node.left, node.right);
        }
      }
      level = next;
    }
    return true;
  }
}`,
  98: `class Solution {
  isValidBST(root) {
    const values = [];
    const walk = (node) => {
      if (node === null) return;
      walk(node.left);
      values.push(node.val);
      walk(node.right);
    };
    walk(root);
    for (let i = 1; i < values.length; i++) {
      if (values[i] <= values[i - 1]) return false;
    }
    return true;
  }
}`,
  530: `class Solution {
  getMinimumDifference(root) {
    const values = [];
    const walk = (node) => {
      if (node === null) return;
      walk(node.left);
      values.push(node.val);
      walk(node.right);
    };
    walk(root);
    let best = Infinity;
    for (let i = 1; i < values.length; i++) {
      best = Math.min(best, values[i] - values[i - 1]);
    }
    return best;
  }
}`,
  230: `class Solution {
  kthSmallest(root, k) {
    const values = [];
    const walk = (node) => {
      if (node === null) return;
      walk(node.left);
      values.push(node.val);
      walk(node.right);
    };
    walk(root);
    return values[k - 1];
  }
}`,
  236: `class Solution {
  lowestCommonAncestor(root, p, q) {
    const find = (node, value) => {
      if (node === null) return null;
      if (node.val === value) return node;
      return find(node.left, value) ?? find(node.right, value);
    };
    const pNode = find(root, p);
    const qNode = find(root, q);
    const parent = new Map();
    const stack = [root];
    while (stack.length > 0) {
      const node = stack.pop();
      if (node.left !== null) {
        parent.set(node.left, node);
        stack.push(node.left);
      }
      if (node.right !== null) {
        parent.set(node.right, node);
        stack.push(node.right);
      }
    }
    const ancestors = new Set();
    let node = pNode;
    while (node !== null && node !== undefined) {
      ancestors.add(node);
      node = parent.get(node);
    }
    node = qNode;
    while (node !== null && node !== undefined) {
      if (ancestors.has(node)) return node;
      node = parent.get(node);
    }
  }
}`,
  114: `class Solution {
  flatten(root) {
    if (root === null) return;
    const order = [];
    const walk = (node) => {
      if (node === null) return;
      order.push(node);
      walk(node.left);
      walk(node.right);
    };
    walk(root);
    for (let i = 0; i < order.length - 1; i++) {
      order[i].left = null;
      order[i].right = order[i + 1];
    }
    order[order.length - 1].left = null;
    order[order.length - 1].right = null;
  }
}`,
  222: `class Solution {
  countNodes(root) {
    if (root === null) return 0;
    let count = 0;
    const stack = [root];
    while (stack.length > 0) {
      const node = stack.pop();
      count++;
      if (node.left !== null) stack.push(node.left);
      if (node.right !== null) stack.push(node.right);
    }
    return count;
  }
}`,

  // ── Kadane ──────────────────────────────────────────────────────────────
  53: `class Solution {
  maxSubArray(nums) {
    let best = -Infinity;
    for (let i = 0; i < nums.length; i++) {
      let sum = 0;
      for (let j = i; j < nums.length; j++) {
        sum += nums[j];
        best = Math.max(best, sum);
      }
    }
    return best;
  }
}`,
  918: `class Solution {
  maxSubarraySumCircular(nums) {
    const n = nums.length;
    let best = -Infinity;
    for (let start = 0; start < n; start++) {
      let sum = 0;
      for (let len = 1; len <= n; len++) {
        sum += nums[(start + len - 1) % n];
        best = Math.max(best, sum);
      }
    }
    return best;
  }
}`,

  // ── Binary Search ───────────────────────────────────────────────────────
  35: `class Solution {
  searchInsert(nums, target) {
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] >= target) return i;
    }
    return nums.length;
  }
}`,
  74: `class Solution {
  searchMatrix(matrix, target) {
    for (const row of matrix) {
      for (const value of row) {
        if (value === target) return true;
      }
    }
    return false;
  }
}`,
  162: `class Solution {
  findPeakElement(nums) {
    for (let i = 0; i < nums.length; i++) {
      const left = i === 0 ? -Infinity : nums[i - 1];
      const right = i === nums.length - 1 ? -Infinity : nums[i + 1];
      if (nums[i] > left && nums[i] > right) return i;
    }
  }
}`,
  33: `class Solution {
  search(nums, target) {
    return nums.indexOf(target);
  }
}`,
  34: `class Solution {
  searchRange(nums, target) {
    let first = -1;
    let last = -1;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] === target) {
        if (first === -1) first = i;
        last = i;
      }
    }
    return [first, last];
  }
}`,
  153: `class Solution {
  findMin(nums) {
    let min = nums[0];
    for (const value of nums) {
      if (value < min) min = value;
    }
    return min;
  }
}`,
  4: `class Solution {
  findMedianSortedArrays(nums1, nums2) {
    const merged = nums1.concat(nums2).sort((a, b) => a - b);
    const middle = Math.floor(merged.length / 2);
    if (merged.length % 2 === 1) return merged[middle];
    return (merged[middle - 1] + merged[middle]) / 2;
  }
}`,

  // ── Heap ────────────────────────────────────────────────────────────────
  215: `class Solution {
  findKthLargest(nums, k) {
    nums.sort((a, b) => b - a);
    return nums[k - 1];
  }
}`,

  // ── Bit Manipulation ────────────────────────────────────────────────────
  67: `class Solution {
  addBinary(a, b) {
    return (BigInt("0b" + a) + BigInt("0b" + b)).toString(2);
  }
}`,
  190: `class Solution {
  reverseBits(n) {
    const bits = n.toString(2).padStart(32, "0").split("").reverse().join("");
    return parseInt(bits, 2);
  }
}`,
  191: `class Solution {
  hammingWeight(n) {
    return n.toString(2).split("1").length - 1;
  }
}`,
  136: `class Solution {
  singleNumber(nums) {
    const counts = new Map();
    for (const num of nums) counts.set(num, (counts.get(num) ?? 0) + 1);
    for (const [num, count] of counts) {
      if (count === 1) return num;
    }
  }
}`,
  137: `class Solution {
  singleNumber(nums) {
    const counts = new Map();
    for (const num of nums) counts.set(num, (counts.get(num) ?? 0) + 1);
    for (const [num, count] of counts) {
      if (count === 1) return num;
    }
  }
}`,
  201: `class Solution {
  rangeBitwiseAnd(left, right) {
    let result = left;
    for (let value = left + 1; value <= right; value++) {
      result = result & value;
    }
    return result;
  }
}`,

  // ── Math ────────────────────────────────────────────────────────────────
  9: `class Solution {
  isPalindrome(x) {
    const s = String(x);
    return s === s.split("").reverse().join("");
  }
}`,
  66: `class Solution {
  plusOne(digits) {
    const value = BigInt(digits.join("")) + 1n;
    return value.toString().split("").map(Number);
  }
}`,
  172: `class Solution {
  trailingZeroes(n) {
    let factorial = 1n;
    for (let i = 2n; i <= BigInt(n); i++) factorial *= i;
    const text = factorial.toString();
    let count = 0;
    for (let i = text.length - 1; i >= 0 && text[i] === "0"; i--) count++;
    return count;
  }
}`,
  69: `class Solution {
  mySqrt(x) {
    let root = 0;
    while ((root + 1) * (root + 1) <= x) root++;
    return root;
  }
}`,
  50: `class Solution {
  myPow(x, n) {
    if (n === 0) return 1;
    let result = 1;
    const steps = Math.abs(n);
    for (let i = 0; i < steps; i++) result *= x;
    return n < 0 ? 1 / result : result;
  }
}`,

  // ── 1D DP ───────────────────────────────────────────────────────────────
  70: `class Solution {
  climbStairs(n) {
    if (n <= 2) return n;
    return this.climbStairs(n - 1) + this.climbStairs(n - 2);
  }
}`,
  198: `class Solution {
  rob(nums) {
    const best = (i) => {
      if (i >= nums.length) return 0;
      return Math.max(nums[i] + best(i + 2), best(i + 1));
    };
    return best(0);
  }
}`,
  139: `class Solution {
  wordBreak(s, wordDict) {
    const can = (start) => {
      if (start === s.length) return true;
      for (const word of wordDict) {
        if (s.startsWith(word, start) && can(start + word.length)) return true;
      }
      return false;
    };
    return can(0);
  }
}`,
  322: `class Solution {
  coinChange(coins, amount) {
    const memo = new Map();
    const minCoins = (remaining) => {
      if (remaining === 0) return 0;
      if (remaining < 0) return Infinity;
      if (memo.has(remaining)) return memo.get(remaining);
      let best = Infinity;
      for (const coin of coins) {
        best = Math.min(best, 1 + minCoins(remaining - coin));
      }
      memo.set(remaining, best);
      return best;
    };
    const result = minCoins(amount);
    return result === Infinity ? -1 : result;
  }
}`,

  // ── Multidimensional DP ─────────────────────────────────────────────────
  120: `class Solution {
  minimumTotal(triangle) {
    const best = (row, col) => {
      if (row === triangle.length) return 0;
      return triangle[row][col] + Math.min(best(row + 1, col), best(row + 1, col + 1));
    };
    return best(0, 0);
  }
}`,
  64: `class Solution {
  minPathSum(grid) {
    const best = (r, c) => {
      if (r === grid.length - 1 && c === grid[0].length - 1) return grid[r][c];
      if (r === grid.length - 1) return grid[r][c] + best(r, c + 1);
      if (c === grid[0].length - 1) return grid[r][c] + best(r + 1, c);
      return grid[r][c] + Math.min(best(r + 1, c), best(r, c + 1));
    };
    return best(0, 0);
  }
}`,
  63: `class Solution {
  uniquePathsWithObstacles(grid) {
    const paths = (r, c) => {
      if (grid[r][c] === 1) return 0;
      if (r === grid.length - 1 && c === grid[0].length - 1) return 1;
      let total = 0;
      if (r + 1 < grid.length) total += paths(r + 1, c);
      if (c + 1 < grid[0].length) total += paths(r, c + 1);
      return total;
    };
    return paths(0, 0);
  }
}`,
  5: `class Solution {
  longestPalindrome(s) {
    let best = "";
    for (let i = 0; i < s.length; i++) {
      for (let j = i; j < s.length; j++) {
        const sub = s.slice(i, j + 1);
        if (sub.length > best.length && sub === sub.split("").reverse().join("")) {
          best = sub;
        }
      }
    }
    return best;
  }
}`,
  72: `class Solution {
  minDistance(word1, word2) {
    const dist = (i, j) => {
      if (i === word1.length) return word2.length - j;
      if (j === word2.length) return word1.length - i;
      if (word1[i] === word2[j]) return dist(i + 1, j + 1);
      return 1 + Math.min(dist(i + 1, j), dist(i, j + 1), dist(i + 1, j + 1));
    };
    return dist(0, 0);
  }
}`,
  221: `class Solution {
  maximalSquare(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    let best = 0;
    for (let size = 1; size <= Math.min(rows, cols); size++) {
      for (let r = 0; r + size <= rows; r++) {
        for (let c = 0; c + size <= cols; c++) {
          let allOnes = true;
          for (let dr = 0; dr < size && allOnes; dr++) {
            for (let dc = 0; dc < size; dc++) {
              if (matrix[r + dr][c + dc] !== "1") {
                allOnes = false;
                break;
              }
            }
          }
          if (allOnes) best = size;
        }
      }
    }
    return best * best;
  }
}`,
};

/** Brute-force solution for a problem number, or undefined when optimal-only. */
export function top150BruteFor(no: number): string | undefined {
  return top150Brutes[no];
}

/** True when a question has a distinct brute-force variant to toggle to. */
export function hasTop150Brute(no: number): boolean {
  return top150Brutes[no] !== undefined;
}
