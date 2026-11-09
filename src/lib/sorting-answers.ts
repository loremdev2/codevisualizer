// ---------------------------------------------------------------------------
// Sorting Algorithms — answers in every language the app provides.
//
// Each algorithm in src/lib/sorting.ts ships a canonical implementation in
// JavaScript, TypeScript, Python, Java, and C++ (the five "available"
// languages in the app). The JavaScript answer is exactly the code the
// visualizer template runs (src/lib/templates.ts — a test guards against
// drift); TypeScript is the typed equivalent and also traces; Python, Java,
// and C++ are idiomatic functions/methods verified against the same input in
// sorting-answers.test.ts. All variants implement the same algorithm, so
// their outputs are identical.
// ---------------------------------------------------------------------------

export type SortingLanguageId = "javascript" | "typescript" | "python" | "java" | "cpp";

export type SortingAnswers = Record<SortingLanguageId, string>;

export type SortingAlgoAnswers = {
  /** Template id in src/lib/templates.ts. */
  id: string;
  /** Entry function/method name used by the Java/C++/Python runners. */
  method: string;
  /** Default input (matches the template's input so Visualize shows the same data). */
  input: { array: number[] };
  /** Expected sorted output for the default input. */
  expected: number[];
  answers: SortingAnswers;
};

export const sortingAlgoAnswers: Record<string, SortingAlgoAnswers> = {
  // ── Bubble sort ──────────────────────────────────────────────────────────
  "bubble-sort": {
    id: "bubble-sort",
    method: "bubbleSort",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1, 2, 3, 5, 8, 9],
    answers: {
      javascript: `const arr = [...input.array];

for (let i = 0; i < arr.length - 1; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}

return arr;`,
      typescript: `const arr: number[] = [...input.array];

for (let i = 0; i < arr.length - 1; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}

return arr;`,
      python: `def bubble_sort(arr):
    for i in range(len(arr) - 1):
        for j in range(len(arr) - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
      java: `class Solution {
    public int[] bubbleSort(int[] nums) {
        for (int i = 0; i < nums.length - 1; i++) {
            for (int j = 0; j < nums.length - i - 1; j++) {
                if (nums[j] > nums[j + 1]) {
                    int temp = nums[j];
                    nums[j] = nums[j + 1];
                    nums[j + 1] = temp;
                }
            }
        }
        return nums;
    }
}`,
      cpp: `#include <vector>
#include <string>
#include <algorithm>
#include <functional>
#include <iostream>
using namespace std;

vector<int> bubbleSort(vector<int>& nums) {
    for (int i = 0; i < (int)nums.size() - 1; i++) {
        for (int j = 0; j < (int)nums.size() - i - 1; j++) {
            if (nums[j] > nums[j + 1]) swap(nums[j], nums[j + 1]);
        }
    }
    return nums;
}`,
    },
  },

  // ── Selection sort ───────────────────────────────────────────────────────
  "selection-sort": {
    id: "selection-sort",
    method: "selectionSort",
    input: { array: [5, 3, 8, 1, 9, 2] },
    expected: [1, 2, 3, 5, 8, 9],
    answers: {
      javascript: `const arr = [...input.array];
const n = arr.length;

for (let i = 0; i < n - 1; i++) {
  let minIndex = i;
  for (let j = i + 1; j < n; j++) {
    if (arr[j] < arr[minIndex]) minIndex = j;
  }
  if (minIndex !== i) {
    [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
  }
}

return arr;`,
      typescript: `const arr: number[] = [...input.array];
const n = arr.length;

for (let i = 0; i < n - 1; i++) {
  let minIndex = i;
  for (let j = i + 1; j < n; j++) {
    if (arr[j] < arr[minIndex]) minIndex = j;
  }
  if (minIndex !== i) {
    [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
  }
}

return arr;`,
      python: `def selection_sort(arr):
    for i in range(len(arr) - 1):
        min_index = i
        for j in range(i + 1, len(arr)):
            if arr[j] < arr[min_index]:
                min_index = j
        if min_index != i:
            arr[i], arr[min_index] = arr[min_index], arr[i]
    return arr`,
      java: `class Solution {
    public int[] selectionSort(int[] nums) {
        for (int i = 0; i < nums.length - 1; i++) {
            int minIndex = i;
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[j] < nums[minIndex]) minIndex = j;
            }
            if (minIndex != i) {
                int temp = nums[i];
                nums[i] = nums[minIndex];
                nums[minIndex] = temp;
            }
        }
        return nums;
    }
}`,
      cpp: `#include <vector>
#include <string>
#include <algorithm>
#include <functional>
#include <iostream>
using namespace std;

vector<int> selectionSort(vector<int>& nums) {
    for (int i = 0; i < (int)nums.size() - 1; i++) {
        int minIndex = i;
        for (int j = i + 1; j < (int)nums.size(); j++) {
            if (nums[j] < nums[minIndex]) minIndex = j;
        }
        if (minIndex != i) swap(nums[i], nums[minIndex]);
    }
    return nums;
}`,
    },
  },

  // ── Insertion sort ───────────────────────────────────────────────────────
  "insertion-sort": {
    id: "insertion-sort",
    method: "insertionSort",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1, 2, 3, 5, 8, 9],
    answers: {
      javascript: `const arr = [...input.array];

for (let i = 1; i < arr.length; i++) {
  const key = arr[i];
  let j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    j -= 1;
  }
  arr[j + 1] = key;
}

return arr;`,
      typescript: `const arr: number[] = [...input.array];

for (let i = 1; i < arr.length; i++) {
  const key = arr[i];
  let j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    j -= 1;
  }
  arr[j + 1] = key;
}

return arr;`,
      python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr`,
      java: `class Solution {
    public int[] insertionSort(int[] nums) {
        for (int i = 1; i < nums.length; i++) {
            int key = nums[i];
            int j = i - 1;
            while (j >= 0 && nums[j] > key) {
                nums[j + 1] = nums[j];
                j--;
            }
            nums[j + 1] = key;
        }
        return nums;
    }
}`,
      cpp: `#include <vector>
#include <string>
#include <algorithm>
#include <functional>
#include <iostream>
using namespace std;

vector<int> insertionSort(vector<int>& nums) {
    for (int i = 1; i < (int)nums.size(); i++) {
        int key = nums[i];
        int j = i - 1;
        while (j >= 0 && nums[j] > key) {
            nums[j + 1] = nums[j];
            j--;
        }
        nums[j + 1] = key;
    }
    return nums;
}`,
    },
  },

  // ── Merge sort ───────────────────────────────────────────────────────────
  "merge-sort": {
    id: "merge-sort",
    method: "mergeSort",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1, 2, 3, 5, 8, 9],
    answers: {
      javascript: `const arr = [...input.array];

function mergeSort(left, right) {
  if (left >= right) return;
  const mid = Math.floor((left + right) / 2);
  mergeSort(left, mid);
  mergeSort(mid + 1, right);
  const merged = [];
  let i = left;
  let j = mid + 1;
  while (i <= mid && j <= right) {
    if (arr[i] <= arr[j]) {
      merged.push(arr[i]);
      i += 1;
    } else {
      merged.push(arr[j]);
      j += 1;
    }
  }
  while (i <= mid) {
    merged.push(arr[i]);
    i += 1;
  }
  while (j <= right) {
    merged.push(arr[j]);
    j += 1;
  }
  for (let k = 0; k < merged.length; k += 1) {
    arr[left + k] = merged[k];
  }
}

mergeSort(0, arr.length - 1);
return arr;`,
      typescript: `const arr: number[] = [...input.array];

function mergeSort(left: number, right: number): void {
  if (left >= right) return;
  const mid = Math.floor((left + right) / 2);
  mergeSort(left, mid);
  mergeSort(mid + 1, right);
  const merged: number[] = [];
  let i = left;
  let j = mid + 1;
  while (i <= mid && j <= right) {
    if (arr[i] <= arr[j]) {
      merged.push(arr[i]);
      i += 1;
    } else {
      merged.push(arr[j]);
      j += 1;
    }
  }
  while (i <= mid) {
    merged.push(arr[i]);
    i += 1;
  }
  while (j <= right) {
    merged.push(arr[j]);
    j += 1;
  }
  for (let k = 0; k < merged.length; k += 1) {
    arr[left + k] = merged[k];
  }
}

mergeSort(0, arr.length - 1);
return arr;`,
      python: `def merge_sort(arr):
    def sort(left, right):
        if left >= right:
            return
        mid = (left + right) // 2
        sort(left, mid)
        sort(mid + 1, right)
        merged = []
        i = left
        j = mid + 1
        while i <= mid and j <= right:
            if arr[i] <= arr[j]:
                merged.append(arr[i])
                i += 1
            else:
                merged.append(arr[j])
                j += 1
        while i <= mid:
            merged.append(arr[i])
            i += 1
        while j <= right:
            merged.append(arr[j])
            j += 1
        for k in range(len(merged)):
            arr[left + k] = merged[k]

    sort(0, len(arr) - 1)
    return arr`,
      java: `class Solution {
    public int[] mergeSort(int[] nums) {
        sort(nums, 0, nums.length - 1);
        return nums;
    }

    private void sort(int[] nums, int left, int right) {
        if (left >= right) return;
        int mid = left + (right - left) / 2;
        sort(nums, left, mid);
        sort(nums, mid + 1, right);
        int[] merged = new int[right - left + 1];
        int i = left;
        int j = mid + 1;
        int k = 0;
        while (i <= mid && j <= right) merged[k++] = nums[i] <= nums[j] ? nums[i++] : nums[j++];
        while (i <= mid) merged[k++] = nums[i++];
        while (j <= right) merged[k++] = nums[j++];
        for (int p = 0; p < merged.length; p++) nums[left + p] = merged[p];
    }
}`,
      cpp: `#include <vector>
#include <string>
#include <algorithm>
#include <functional>
#include <iostream>
using namespace std;

vector<int> mergeSort(vector<int>& nums) {
    function<void(int, int)> sort = [&](int left, int right) {
        if (left >= right) return;
        int mid = left + (right - left) / 2;
        sort(left, mid);
        sort(mid + 1, right);
        vector<int> merged;
        int i = left;
        int j = mid + 1;
        while (i <= mid && j <= right) {
            if (nums[i] <= nums[j]) merged.push_back(nums[i++]);
            else merged.push_back(nums[j++]);
        }
        while (i <= mid) merged.push_back(nums[i++]);
        while (j <= right) merged.push_back(nums[j++]);
        for (int k = 0; k < (int)merged.size(); k++) nums[left + k] = merged[k];
    };
    sort(0, (int)nums.size() - 1);
    return nums;
}`,
    },
  },

  // ── Quick sort ───────────────────────────────────────────────────────────
  "quick-sort": {
    id: "quick-sort",
    method: "quickSort",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1, 2, 3, 5, 8, 9],
    answers: {
      javascript: `const arr = [...input.array];

function quickSort(low, high) {
  if (low >= high) return;
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j += 1) {
    if (arr[j] < pivot) {
      i += 1;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  const p = i + 1;
  quickSort(low, p - 1);
  quickSort(p + 1, high);
}

quickSort(0, arr.length - 1);
return arr;`,
      typescript: `const arr: number[] = [...input.array];

function quickSort(low: number, high: number): void {
  if (low >= high) return;
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j += 1) {
    if (arr[j] < pivot) {
      i += 1;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  const p = i + 1;
  quickSort(low, p - 1);
  quickSort(p + 1, high);
}

quickSort(0, arr.length - 1);
return arr;`,
      python: `def quick_sort(arr):
    def sort(low, high):
        if low >= high:
            return
        pivot = arr[high]
        i = low - 1
        for j in range(low, high):
            if arr[j] < pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
        arr[i + 1], arr[high] = arr[high], arr[i + 1]
        p = i + 1
        sort(low, p - 1)
        sort(p + 1, high)

    sort(0, len(arr) - 1)
    return arr`,
      java: `class Solution {
    public int[] quickSort(int[] nums) {
        sort(nums, 0, nums.length - 1);
        return nums;
    }

    private void sort(int[] nums, int low, int high) {
        if (low >= high) return;
        int pivot = nums[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (nums[j] < pivot) {
                i++;
                int temp = nums[i];
                nums[i] = nums[j];
                nums[j] = temp;
            }
        }
        int temp = nums[i + 1];
        nums[i + 1] = nums[high];
        nums[high] = temp;
        int p = i + 1;
        sort(nums, low, p - 1);
        sort(nums, p + 1, high);
    }
}`,
      cpp: `#include <vector>
#include <string>
#include <algorithm>
#include <functional>
#include <iostream>
using namespace std;

vector<int> quickSort(vector<int>& nums) {
    function<void(int, int)> sort = [&](int low, int high) {
        if (low >= high) return;
        int pivot = nums[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (nums[j] < pivot) {
                i++;
                swap(nums[i], nums[j]);
            }
        }
        swap(nums[i + 1], nums[high]);
        int p = i + 1;
        sort(low, p - 1);
        sort(p + 1, high);
    };
    sort(0, (int)nums.size() - 1);
    return nums;
}`,
    },
  },

  // ── Heap sort ────────────────────────────────────────────────────────────
  "heap-sort": {
    id: "heap-sort",
    method: "heapSort",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1, 2, 3, 5, 8, 9],
    answers: {
      javascript: `const arr = [...input.array];
const n = arr.length;

function heapify(size, root) {
  let largest = root;
  const left = 2 * root + 1;
  const right = 2 * root + 2;
  if (left < size && arr[left] > arr[largest]) largest = left;
  if (right < size && arr[right] > arr[largest]) largest = right;
  if (largest !== root) {
    [arr[root], arr[largest]] = [arr[largest], arr[root]];
    heapify(size, largest);
  }
}

for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
  heapify(n, i);
}
for (let i = n - 1; i > 0; i -= 1) {
  [arr[0], arr[i]] = [arr[i], arr[0]];
  heapify(i, 0);
}

return arr;`,
      typescript: `const arr: number[] = [...input.array];
const n = arr.length;

function heapify(size: number, root: number): void {
  let largest = root;
  const left = 2 * root + 1;
  const right = 2 * root + 2;
  if (left < size && arr[left] > arr[largest]) largest = left;
  if (right < size && arr[right] > arr[largest]) largest = right;
  if (largest !== root) {
    [arr[root], arr[largest]] = [arr[largest], arr[root]];
    heapify(size, largest);
  }
}

for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
  heapify(n, i);
}
for (let i = n - 1; i > 0; i -= 1) {
  [arr[0], arr[i]] = [arr[i], arr[0]];
  heapify(i, 0);
}

return arr;`,
      python: `def heap_sort(arr):
    n = len(arr)

    def heapify(size, root):
        largest = root
        left = 2 * root + 1
        right = 2 * root + 2
        if left < size and arr[left] > arr[largest]:
            largest = left
        if right < size and arr[right] > arr[largest]:
            largest = right
        if largest != root:
            arr[root], arr[largest] = arr[largest], arr[root]
            heapify(size, largest)

    for i in range(n // 2 - 1, -1, -1):
        heapify(n, i)
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(i, 0)
    return arr`,
      java: `class Solution {
    public int[] heapSort(int[] nums) {
        int n = nums.length;
        for (int i = n / 2 - 1; i >= 0; i--) heapify(nums, n, i);
        for (int i = n - 1; i > 0; i--) {
            int temp = nums[0];
            nums[0] = nums[i];
            nums[i] = temp;
            heapify(nums, i, 0);
        }
        return nums;
    }

    private void heapify(int[] nums, int size, int root) {
        int largest = root;
        int left = 2 * root + 1;
        int right = 2 * root + 2;
        if (left < size && nums[left] > nums[largest]) largest = left;
        if (right < size && nums[right] > nums[largest]) largest = right;
        if (largest != root) {
            int temp = nums[root];
            nums[root] = nums[largest];
            nums[largest] = temp;
            heapify(nums, size, largest);
        }
    }
}`,
      cpp: `#include <vector>
#include <string>
#include <algorithm>
#include <functional>
#include <iostream>
using namespace std;

vector<int> heapSort(vector<int>& nums) {
    int n = (int)nums.size();
    function<void(int, int)> heapify = [&](int size, int root) {
        int largest = root;
        int left = 2 * root + 1;
        int right = 2 * root + 2;
        if (left < size && nums[left] > nums[largest]) largest = left;
        if (right < size && nums[right] > nums[largest]) largest = right;
        if (largest != root) {
            swap(nums[root], nums[largest]);
            heapify(size, largest);
        }
    };
    for (int i = n / 2 - 1; i >= 0; i--) heapify(n, i);
    for (int i = n - 1; i > 0; i--) {
        swap(nums[0], nums[i]);
        heapify(i, 0);
    }
    return nums;
}`,
    },
  },

  // ── Counting sort ────────────────────────────────────────────────────────
  "counting-sort": {
    id: "counting-sort",
    method: "countingSort",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1, 2, 3, 5, 8, 9],
    answers: {
      javascript: `const arr = [...input.array];
if (arr.length === 0) return arr;
const max = Math.max(...arr);
const counts = new Array(max + 1).fill(0);
for (const value of arr) {
  counts[value] += 1;
}
let index = 0;
for (let value = 0; value <= max; value += 1) {
  while (counts[value] > 0) {
    arr[index] = value;
    index += 1;
    counts[value] -= 1;
  }
}
return arr;`,
      typescript: `const arr: number[] = [...input.array];
if (arr.length === 0) return arr;
const max = Math.max(...arr);
const counts = new Array(max + 1).fill(0);
for (const value of arr) {
  counts[value] += 1;
}
let index = 0;
for (let value = 0; value <= max; value += 1) {
  while (counts[value] > 0) {
    arr[index] = value;
    index += 1;
    counts[value] -= 1;
  }
}
return arr;`,
      python: `def counting_sort(arr):
    if not arr:
        return arr
    maximum = max(arr)
    counts = [0] * (maximum + 1)
    for value in arr:
        counts[value] += 1
    index = 0
    for value in range(maximum + 1):
        while counts[value] > 0:
            arr[index] = value
            index += 1
            counts[value] -= 1
    return arr`,
      java: `class Solution {
    public int[] countingSort(int[] nums) {
        if (nums.length == 0) return nums;
        int max = 0;
        for (int num : nums) max = Math.max(max, num);
        int[] counts = new int[max + 1];
        for (int num : nums) counts[num]++;
        int index = 0;
        for (int value = 0; value <= max; value++) {
            while (counts[value] > 0) {
                nums[index] = value;
                index++;
                counts[value]--;
            }
        }
        return nums;
    }
}`,
      cpp: `#include <vector>
#include <string>
#include <algorithm>
#include <functional>
#include <iostream>
using namespace std;

vector<int> countingSort(vector<int>& nums) {
    if (nums.empty()) return nums;
    int maxValue = *max_element(nums.begin(), nums.end());
    vector<int> counts(maxValue + 1, 0);
    for (int num : nums) counts[num]++;
    int index = 0;
    for (int value = 0; value <= maxValue; value++) {
        while (counts[value] > 0) {
            nums[index] = value;
            index++;
            counts[value]--;
        }
    }
    return nums;
}`,
    },
  },
};

/** Languages every algorithm ships (drives the Solutions tabs). */
export const sortingLanguageTabs: Array<{ id: SortingLanguageId; label: string }> = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
];

/** Answers for an algorithm by template id (undefined when absent). */
export function sortingAnswersFor(id: string): SortingAlgoAnswers | undefined {
  return sortingAlgoAnswers[id];
}
