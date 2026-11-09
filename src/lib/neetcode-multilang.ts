// ---------------------------------------------------------------------------
// Multi-language variants (Python, TypeScript, Java, C++) for the NeetCode Roadmap templates.
//
// AUTO-GENERATED from templates/neetcode-multilang.json — do not edit by hand.
// Each entry mirrors the JS solution in neetcode-templates.ts (same class
// Solution + method + parameter names, so the auto-detected harness maps
// the input identically). All solutions are verified in neetcode-templates.test.ts.
// ---------------------------------------------------------------------------

export type NeetCodeMultiLang = {
  pythonCode?: string;
  typescriptCode?: string;
  javaCode?: string;
  cppCode?: string;
  brutePythonCode?: string;
  bruteTypeScriptCode?: string;
  bruteJavaCode?: string;
  bruteCppCode?: string;
};

export const neetcodeMultiLang: Partial<Record<number, NeetCodeMultiLang>> = {
  7: {
pythonCode: `class Solution:
    def reverse(self, x):
        result = 0
        value = abs(x)
        while value > 0:
            result = result * 10 + value % 10
            value //= 10
        signed = -result if x < 0 else result
        if signed > 2**31 - 1 or signed < -(2**31):
            return 0
        return signed`,
typescriptCode: `class Solution {
  reverse(x: number): number {
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
javaCode: `class Solution {
    public int reverse(int x) {
        long result = 0;
        int value = Math.abs(x);
        while (value > 0) {
            result = result * 10 + value % 10;
            value /= 10;
        }
        long signed = x < 0 ? -result : result;
        if (signed > Integer.MAX_VALUE || signed < Integer.MIN_VALUE) return 0;
        return (int) signed;
    }
}`,
cppCode: `class Solution {
public:
    int reverse(int x) {
        long result = 0;
        int value = abs(x);
        while (value > 0) {
            result = result * 10 + value % 10;
            value /= 10;
        }
        long signed_ = x < 0 ? -result : result;
        if (signed_ > INT_MAX || signed_ < INT_MIN) return 0;
        return (int)signed_;
    }
};`,
},
  40: {
pythonCode: `class Solution:
    def combinationSum2(self, candidates, target):
        candidates.sort()
        result = []

        def backtrack(start, current, total):
            if total == target:
                result.append(current[:])
                return
            if total > target:
                return
            for i in range(start, len(candidates)):
                if i > start and candidates[i] == candidates[i - 1]:
                    continue
                current.append(candidates[i])
                backtrack(i + 1, current, total + candidates[i])
                current.pop()

        backtrack(0, [], 0)
        return result`,
typescriptCode: `class Solution {
  combinationSum2(candidates: number[], target: number): number[][] {
    candidates.sort((a, b) => a - b);
    const result: number[][] = [];
    const backtrack = (start: number, current: number[], sum: number): void => {
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
javaCode: `class Solution {
    public List<List<Integer>> combinationSum2(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> result = new ArrayList<>();
        backtrack(candidates, target, 0, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(int[] cands, int target, int start, List<Integer> cur, List<List<Integer>> result) {
        if (target == 0) { result.add(new ArrayList<>(cur)); return; }
        if (target < 0) return;
        for (int i = start; i < cands.length; i++) {
            if (i > start && cands[i] == cands[i-1]) continue;
            cur.add(cands[i]);
            backtrack(cands, target - cands[i], i + 1, cur, result);
            cur.remove(cur.size() - 1);
        }
    }
}`,
cppCode: `class Solution {
public:
    vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        vector<vector<int>> result;
        function<void(int,int,vector<int>&)> bt = [&](int start, int rem, vector<int>& cur) {
            if (rem == 0) { result.push_back(cur); return; }
            if (rem < 0) return;
            for (int i = start; i < candidates.size(); i++) {
                if (i > start && candidates[i] == candidates[i-1]) continue;
                cur.push_back(candidates[i]);
                bt(i+1, rem-candidates[i], cur);
                cur.pop_back();
            }
        };
        vector<int> cur;
        bt(0, target, cur);
        return result;
    }
};`,
},
  43: {
pythonCode: `class Solution:
    def multiply(self, num1, num2):
        if num1 == '0' or num2 == '0':
            return '0'
        result = [0] * (len(num1) + len(num2))
        for i in range(len(num1) - 1, -1, -1):
            for j in range(len(num2) - 1, -1, -1):
                product = int(num1[i]) * int(num2[j])
                pos = i + j + 1
                s = result[pos] + product
                result[pos] = s % 10
                result[pos - 1] += s // 10
        result_str = ''.join(map(str, result))
        return result_str.lstrip('0') or '0'`,
typescriptCode: `class Solution {
  multiply(num1: string, num2: string): string {
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
javaCode: `class Solution {
    public String multiply(String num1, String num2) {
        int[] result = new int[num1.length() + num2.length()];
        for (int i = num1.length()-1; i >= 0; i--) {
            for (int j = num2.length()-1; j >= 0; j--) {
                int product = (num1.charAt(i)-'0') * (num2.charAt(j)-'0');
                int pos = i + j + 1;
                int sum = result[pos] + product;
                result[pos] = sum % 10;
                result[pos-1] += sum / 10;
            }
        }
        StringBuilder sb = new StringBuilder();
        for (int v : result) sb.append(v);
        String s = sb.toString().replaceFirst("^0+", "");
        return s.isEmpty() ? "0" : s;
    }
}`,
cppCode: `class Solution {
public:
    string multiply(string num1, string num2) {
        vector<int> result(num1.size()+num2.size(), 0);
        for (int i = num1.size()-1; i >= 0; i--)
            for (int j = num2.size()-1; j >= 0; j--) {
                int prod = (num1[i]-'0')*(num2[j]-'0');
                int pos = i+j+1, sum = result[pos]+prod;
                result[pos] = sum%10;
                result[pos-1] += sum/10;
            }
        string s;
        for (int v : result) s += to_string(v);
        size_t start = s.find_first_not_of('0');
        return (start == string::npos) ? "0" : s.substr(start);
    }
};`,
},
  51: {
pythonCode: `class Solution:
    def solveNQueens(self, n):
        result = []
        board = [['.'] * n for _ in range(n)]
        cols = set()
        diag1 = set()
        diag2 = set()

        def place(row):
            if row == n:
                result.append([''.join(r) for r in board])
                return
            for col in range(n):
                d1 = row - col
                d2 = row + col
                if col in cols or d1 in diag1 or d2 in diag2:
                    continue
                board[row][col] = 'Q'
                cols.add(col)
                diag1.add(d1)
                diag2.add(d2)
                place(row + 1)
                board[row][col] = '.'
                cols.remove(col)
                diag1.remove(d1)
                diag2.remove(d2)

        place(0)
        return result`,
typescriptCode: `class Solution {
  solveNQueens(n: number): string[][] {
    const result: string[][] = [];
    const board: string[][] = new Array(n).fill(0).map(() => new Array(n).fill("."));
    const cols = new Set<number>();
    const diag1 = new Set<number>();
    const diag2 = new Set<number>();
    const place = (row: number): void => {
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
javaCode: `class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> result = new ArrayList<>();
        char[][] board = new char[n][n];
        for (char[] row : board) Arrays.fill(row, '.');
        backtrack(board, 0, new HashSet<>(), new HashSet<>(), new HashSet<>(), n, result);
        return result;
    }
    private void backtrack(char[][] board, int row, Set<Integer> cols, Set<Integer> d1, Set<Integer> d2, int n, List<List<String>> result) {
        if (row == n) {
            List<String> snapshot = new ArrayList<>();
            for (char[] r : board) snapshot.add(new String(r));
            result.add(snapshot);
            return;
        }
        for (int col = 0; col < n; col++) {
            if (cols.contains(col) || d1.contains(row-col) || d2.contains(row+col)) continue;
            board[row][col] = 'Q';
            cols.add(col); d1.add(row-col); d2.add(row+col);
            backtrack(board, row+1, cols, d1, d2, n, result);
            board[row][col] = '.';
            cols.remove(col); d1.remove(row-col); d2.remove(row+col);
        }
    }
}`,
cppCode: `class Solution {
public:
    vector<vector<string>> solveNQueens(int n) {
        vector<vector<string>> result;
        vector<string> board(n, string(n, '.'));
        unordered_set<int> cols, d1, d2;
        function<void(int)> place = [&](int row) {
            if (row == n) { result.push_back(board); return; }
            for (int col = 0; col < n; col++) {
                if (cols.count(col) || d1.count(row-col) || d2.count(row+col)) continue;
                board[row][col] = 'Q';
                cols.insert(col); d1.insert(row-col); d2.insert(row+col);
                place(row+1);
                board[row][col] = '.';
                cols.erase(col); d1.erase(row-col); d2.erase(row+col);
            }
        };
        place(0);
        return result;
    }
};`,
},
  62: {
pythonCode: `class Solution:
    def uniquePaths(self, m, n):
        dp = [1] * n
        for row in range(1, m):
            for col in range(1, n):
                dp[col] += dp[col - 1]
        return dp[n - 1]`,
typescriptCode: `class Solution {
  uniquePaths(m: number, n: number): number {
    const dp = new Array(n).fill(1);
    for (let row = 1; row < m; row++) {
      for (let col = 1; col < n; col++) {
        dp[col] += dp[col - 1];
      }
    }
    return dp[n - 1];
  }
}`,
javaCode: `class Solution {
    public int uniquePaths(int m, int n) {
        int[] dp = new int[n];
        Arrays.fill(dp, 1);
        for (int row = 1; row < m; row++) {
            for (int col = 1; col < n; col++) {
                dp[col] += dp[col - 1];
            }
        }
        return dp[n - 1];
    }
}`,
cppCode: `class Solution {
public:
    int uniquePaths(int m, int n) {
        vector<int> dp(n, 1);
        for (int row = 1; row < m; row++)
            for (int col = 1; col < n; col++)
                dp[col] += dp[col-1];
        return dp[n-1];
    }
};`,
},
  75: {
pythonCode: `class Solution:
    def sortColors(self, nums):
        left, right, i = 0, len(nums) - 1, 0
        while i <= right:
            if nums[i] == 0:
                nums[left], nums[i] = nums[i], nums[left]
                left += 1
                i += 1
            elif nums[i] == 2:
                nums[right], nums[i] = nums[i], nums[right]
                right -= 1
            else:
                i += 1`,
typescriptCode: `class Solution {
  sortColors(nums: number[]): void {
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
javaCode: `class Solution {
    public void sortColors(int[] nums) {
        int left = 0, right = nums.length - 1, i = 0;
        while (i <= right) {
            if (nums[i] == 0) {
                int temp = nums[left]; nums[left] = nums[i]; nums[i] = temp;
                left++; i++;
            } else if (nums[i] == 2) {
                int temp = nums[right]; nums[right] = nums[i]; nums[i] = temp;
                right--;
            } else i++;
        }
    }
}`,
cppCode: `class Solution {
public:
    void sortColors(vector<int>& nums) {
        int left = 0, right = nums.size()-1, i = 0;
        while (i <= right) {
            if (nums[i] == 0) swap(nums[left++], nums[i++]);
            else if (nums[i] == 2) swap(nums[right--], nums[i]);
            else i++;
        }
    }
};`,
},
  78: {
pythonCode: `class Solution:
    def subsets(self, nums):
        result = []

        def backtrack(start, current):
            result.append(current[:])
            for i in range(start, len(nums)):
                current.append(nums[i])
                backtrack(i + 1, current)
                current.pop()

        backtrack(0, [])
        return result`,
typescriptCode: `class Solution {
  subsets(nums: number[]): number[][] {
    const result: number[][] = [];
    const backtrack = (start: number, current: number[]): void => {
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
javaCode: `class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
        result.add(new ArrayList<>(current));
        for (int i = start; i < nums.length; i++) {
            current.add(nums[i]);
            backtrack(nums, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }
}`,
cppCode: `class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> result;
        function<void(int, vector<int>&)> bt = [&](int start, vector<int>& cur) {
            result.push_back(cur);
            for (int i = start; i < nums.size(); i++) {
                cur.push_back(nums[i]);
                bt(i+1, cur);
                cur.pop_back();
            }
        };
        vector<int> cur;
        bt(0, cur);
        return result;
    }
};`,
},
  90: {
pythonCode: `class Solution:
    def subsetsWithDup(self, nums):
        nums.sort()
        result = []

        def backtrack(start, current):
            result.append(current[:])
            for i in range(start, len(nums)):
                if i > start and nums[i] == nums[i - 1]:
                    continue
                current.append(nums[i])
                backtrack(i + 1, current)
                current.pop()

        backtrack(0, [])
        return result`,
typescriptCode: `class Solution {
  subsetsWithDup(nums: number[]): number[][] {
    nums.sort((a, b) => a - b);
    const result: number[][] = [];
    const backtrack = (start: number, current: number[]): void => {
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
javaCode: `class Solution {
    public List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
        result.add(new ArrayList<>(current));
        for (int i = start; i < nums.length; i++) {
            if (i > start && nums[i] == nums[i - 1]) continue;
            current.add(nums[i]);
            backtrack(nums, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }
}`,
cppCode: `class Solution {
public:
    vector<vector<int>> subsetsWithDup(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> result;
        function<void(int, vector<int>&)> bt = [&](int start, vector<int>& cur) {
            result.push_back(cur);
            for (int i = start; i < nums.size(); i++) {
                if (i > start && nums[i] == nums[i-1]) continue;
                cur.push_back(nums[i]);
                bt(i+1, cur);
                cur.pop_back();
            }
        };
        vector<int> cur;
        bt(0, cur);
        return result;
    }
};`,
},
  91: {
pythonCode: `class Solution:
    def numDecodings(self, s):
        if not s or s[0] == '0':
            return 0
        one_back = 1
        two_back = 1
        for i in range(1, len(s)):
            current = 0
            if s[i] != '0':
                current += one_back
            two = int(s[i - 1:i + 1])
            if 10 <= two <= 26:
                current += two_back
            two_back = one_back
            one_back = current
        return one_back`,
typescriptCode: `class Solution {
  numDecodings(s: string): number {
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
javaCode: `class Solution {
    public int numDecodings(String s) {
        if (s.isEmpty() || s.charAt(0) == '0') return 0;
        int oneBack = 1, twoBack = 1;
        for (int i = 1; i < s.length(); i++) {
            int current = 0;
            if (s.charAt(i) != '0') current += oneBack;
            int two = Integer.parseInt(s.substring(i-1, i+1));
            if (two >= 10 && two <= 26) current += twoBack;
            twoBack = oneBack;
            oneBack = current;
        }
        return oneBack;
    }
}`,
cppCode: `class Solution {
public:
    int numDecodings(string s) {
        if (s.empty() || s[0] == '0') return 0;
        int oneBack = 1, twoBack = 1;
        for (int i = 1; i < s.size(); i++) {
            int cur = 0;
            if (s[i] != '0') cur += oneBack;
            int two = (s[i-1]-'0')*10 + (s[i]-'0');
            if (two >= 10 && two <= 26) cur += twoBack;
            twoBack = oneBack;
            oneBack = cur;
        }
        return oneBack;
    }
};`,
},
  93: {
pythonCode: `class Solution:
    def restoreIpAddresses(self, s):
        result = []

        def backtrack(start, parts):
            if len(parts) == 4:
                if start == len(s):
                    result.append('.'.join(parts))
                return
            if start >= len(s):
                return
            for length in range(1, 4):
                if start + length > len(s):
                    break
                segment = s[start:start + length]
                if len(segment) > 1 and segment[0] == '0':
                    continue
                if int(segment) > 255:
                    continue
                parts.append(segment)
                backtrack(start + length, parts)
                parts.pop()

        backtrack(0, [])
        return result`,
typescriptCode: `class Solution {
  restoreIpAddresses(s: string): string[] {
    const result: string[] = [];
    const backtrack = (start: number, parts: string[]): void => {
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
javaCode: `class Solution {
    public List<String> restoreIpAddresses(String s) {
        List<String> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(String s, int start, List<String> parts, List<String> result) {
        if (parts.size() == 4) {
            if (start == s.length()) result.add(String.join(".", parts));
            return;
        }
        for (int len = 1; len <= 3 && start + len <= s.length(); len++) {
            String seg = s.substring(start, start + len);
            if (seg.length() > 1 && seg.startsWith("0")) continue;
            if (Integer.parseInt(seg) > 255) continue;
            parts.add(seg);
            backtrack(s, start + len, parts, result);
            parts.remove(parts.size() - 1);
        }
    }
}`,
cppCode: `class Solution {
public:
    vector<string> restoreIpAddresses(string s) {
        vector<string> result;
        function<void(int, vector<string>&)> bt = [&](int start, vector<string>& parts) {
            if (parts.size() == 4) {
                if (start == s.size()) {
                    string ip = parts[0]+"."+parts[1]+"."+parts[2]+"."+parts[3];
                    result.push_back(ip);
                }
                return;
            }
            for (int len = 1; len <= 3 && start+len <= s.size(); len++) {
                string seg = s.substr(start, len);
                if (seg.size() > 1 && seg[0] == '0') continue;
                if (stoi(seg) > 255) continue;
                parts.push_back(seg);
                bt(start+len, parts);
                parts.pop_back();
            }
        };
        vector<string> parts;
        bt(0, parts);
        return result;
    }
};`,
},
  94: {
pythonCode: `class Solution:
    def inorderTraversal(self, root):
        result = []

        def walk(node):
            if not node:
                return
            walk(node.left)
            result.append(node.val)
            walk(node.right)

        walk(root)
        return result`,
typescriptCode: `class Solution {
  inorderTraversal(root: TreeNode | null): number[] {
    const result: number[] = [];
    const walk = (node: TreeNode | null): void => {
      if (node === null) return;
      walk(node.left);
      result.push(node.val);
      walk(node.right);
    };
    walk(root);
    return result;
  }
}`,
javaCode: `class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        inorder(root, result);
        return result;
    }
    private void inorder(TreeNode node, List<Integer> result) {
        if (node == null) return;
        inorder(node.left, result);
        result.add(node.val);
        inorder(node.right, result);
    }
}`,
cppCode: `class Solution {
public:
    vector<int> inorderTraversal(TreeNode* root) {
        vector<int> result;
        function<void(TreeNode*)> walk = [&](TreeNode* node) {
            if (!node) return;
            walk(node->left);
            result.push_back(node->val);
            walk(node->right);
        };
        walk(root);
        return result;
    }
};`,
},
  110: {
pythonCode: `class Solution:
    def isBalanced(self, root):
        def height(node):
            if not node:
                return 0
            left = height(node.left)
            if left == -1:
                return -1
            right = height(node.right)
            if right == -1:
                return -1
            if abs(left - right) > 1:
                return -1
            return 1 + max(left, right)

        return height(root) != -1`,
typescriptCode: `class Solution {
  isBalanced(root: TreeNode | null): boolean {
    return this.height(root) !== -1;
  }
  height(node: TreeNode | null): number {
    if (node === null) return 0;
    const left = this.height(node.left);
    if (left === -1) return -1;
    const right = this.height(node.right);
    if (right === -1) return -1;
    if (Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
  }
}`,
javaCode: `class Solution {
    public boolean isBalanced(TreeNode root) {
        return height(root) != -1;
    }
    private int height(TreeNode node) {
        if (node == null) return 0;
        int left = height(node.left);
        if (left == -1) return -1;
        int right = height(node.right);
        if (right == -1) return -1;
        if (Math.abs(left - right) > 1) return -1;
        return 1 + Math.max(left, right);
    }
}`,
cppCode: `class Solution {
public:
    bool isBalanced(TreeNode* root) { return ht(root) != -1; }
    int ht(TreeNode* node) {
        if (!node) return 0;
        int l = ht(node->left);
        if (l == -1) return -1;
        int r = ht(node->right);
        if (r == -1) return -1;
        if (abs(l-r) > 1) return -1;
        return 1 + max(l, r);
    }
};`,
},
  118: {
pythonCode: `class Solution:
    def generate(self, numRows):
        triangle = []
        for row in range(numRows):
            current = [1] * (row + 1)
            for col in range(1, row):
                current[col] = triangle[row - 1][col - 1] + triangle[row - 1][col]
            triangle.append(current)
        return triangle`,
typescriptCode: `class Solution {
  generate(numRows: number): number[][] {
    const triangle: number[][] = [];
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
javaCode: `class Solution {
    public List<List<Integer>> generate(int numRows) {
        List<List<Integer>> triangle = new ArrayList<>();
        for (int row = 0; row < numRows; row++) {
            List<Integer> current = new ArrayList<>(row + 1);
            for (int col = 0; col <= row; col++) current.add(1);
            for (int col = 1; col < row; col++)
                current.set(col, triangle.get(row-1).get(col-1) + triangle.get(row-1).get(col));
            triangle.add(current);
        }
        return triangle;
    }
}`,
cppCode: `class Solution {
public:
    vector<vector<int>> generate(int numRows) {
        vector<vector<int>> triangle(numRows);
        for (int row = 0; row < numRows; row++) {
            triangle[row].resize(row+1, 1);
            for (int col = 1; col < row; col++)
                triangle[row][col] = triangle[row-1][col-1] + triangle[row-1][col];
        }
        return triangle;
    }
};`,
},
  131: {
pythonCode: `class Solution:
    def partition(self, s):
        result = []

        def is_palindrome(left, right):
            while left < right:
                if s[left] != s[right]:
                    return False
                left += 1
                right -= 1
            return True

        def backtrack(start, current):
            if start == len(s):
                result.append(current[:])
                return
            for end in range(start, len(s)):
                if is_palindrome(start, end):
                    current.append(s[start:end + 1])
                    backtrack(end + 1, current)
                    current.pop()

        backtrack(0, [])
        return result`,
typescriptCode: `class Solution {
  partition(s: string): string[][] {
    const result: string[][] = [];
    const backtrack = (start: number, current: string[]): void => {
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
  isPalindrome(s: string, left: number, right: number): boolean {
    while (left < right) {
      if (s[left] !== s[right]) return false;
      left++;
      right--;
    }
    return true;
  }
}`,
javaCode: `class Solution {
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }
    private void backtrack(String s, int start, List<String> cur, List<List<String>> result) {
        if (start == s.length()) { result.add(new ArrayList<>(cur)); return; }
        for (int end = start; end < s.length(); end++) {
            if (isPalin(s, start, end)) {
                cur.add(s.substring(start, end + 1));
                backtrack(s, end + 1, cur, result);
                cur.remove(cur.size() - 1);
            }
        }
    }
    private boolean isPalin(String s, int l, int r) {
        while (l < r) if (s.charAt(l++) != s.charAt(r--)) return false;
        return true;
    }
}`,
cppCode: `class Solution {
public:
    vector<vector<string>> partition(string s) {
        vector<vector<string>> result;
        function<void(int, vector<string>&)> bt = [&](int start, vector<string>& cur) {
            if (start == s.size()) { result.push_back(cur); return; }
            for (int end = start; end < s.size(); end++) {
                if (isPalin(s, start, end)) {
                    cur.push_back(s.substr(start, end-start+1));
                    bt(end+1, cur);
                    cur.pop_back();
                }
            }
        };
        vector<string> cur;
        bt(0, cur);
        return result;
    }
    bool isPalin(string& s, int l, int r) {
        while (l < r) if (s[l++] != s[r--]) return false;
        return true;
    }
};`,
},
  144: {
pythonCode: `class Solution:
    def preorderTraversal(self, root):
        result = []

        def walk(node):
            if not node:
                return
            result.append(node.val)
            walk(node.left)
            walk(node.right)

        walk(root)
        return result`,
typescriptCode: `class Solution {
  preorderTraversal(root: TreeNode | null): number[] {
    const result: number[] = [];
    const walk = (node: TreeNode | null): void => {
      if (node === null) return;
      result.push(node.val);
      walk(node.left);
      walk(node.right);
    };
    walk(root);
    return result;
  }
}`,
javaCode: `class Solution {
    public List<Integer> preorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        preorder(root, result);
        return result;
    }
    private void preorder(TreeNode node, List<Integer> result) {
        if (node == null) return;
        result.add(node.val);
        preorder(node.left, result);
        preorder(node.right, result);
    }
}`,
cppCode: `class Solution {
public:
    vector<int> preorderTraversal(TreeNode* root) {
        vector<int> result;
        function<void(TreeNode*)> walk = [&](TreeNode* node) {
            if (!node) return;
            result.push_back(node->val);
            walk(node->left);
            walk(node->right);
        };
        walk(root);
        return result;
    }
};`,
},
  145: {
pythonCode: `class Solution:
    def postorderTraversal(self, root):
        result = []

        def walk(node):
            if not node:
                return
            walk(node.left)
            walk(node.right)
            result.append(node.val)

        walk(root)
        return result`,
typescriptCode: `class Solution {
  postorderTraversal(root: TreeNode | null): number[] {
    const result: number[] = [];
    const walk = (node: TreeNode | null): void => {
      if (node === null) return;
      walk(node.left);
      walk(node.right);
      result.push(node.val);
    };
    walk(root);
    return result;
  }
}`,
javaCode: `class Solution {
    public List<Integer> postorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        postorder(root, result);
        return result;
    }
    private void postorder(TreeNode node, List<Integer> result) {
        if (node == null) return;
        postorder(node.left, result);
        postorder(node.right, result);
        result.add(node.val);
    }
}`,
cppCode: `class Solution {
public:
    vector<int> postorderTraversal(TreeNode* root) {
        vector<int> result;
        function<void(TreeNode*)> walk = [&](TreeNode* node) {
            if (!node) return;
            walk(node->left);
            walk(node->right);
            result.push_back(node->val);
        };
        walk(root);
        return result;
    }
};`,
},
  152: {
pythonCode: `class Solution:
    def maxProduct(self, nums):
        best = nums[0]
        mx = nums[0]
        mn = nums[0]
        for i in range(1, len(nums)):
            candidates = [nums[i], mx * nums[i], mn * nums[i]]
            mx = max(candidates)
            mn = min(candidates)
            best = max(best, mx)
        return best`,
typescriptCode: `class Solution {
  maxProduct(nums: number[]): number {
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
javaCode: `class Solution {
    public int maxProduct(int[] nums) {
        int best = nums[0], mx = nums[0], mn = nums[0];
        for (int i = 1; i < nums.length; i++) {
            int[] c = {nums[i], mx*nums[i], mn*nums[i]};
            mx = Math.max(c[0], Math.max(c[1], c[2]));
            mn = Math.min(c[0], Math.min(c[1], c[2]));
            best = Math.max(best, mx);
        }
        return best;
    }
}`,
cppCode: `class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int best = nums[0], mx = nums[0], mn = nums[0];
        for (int i = 1; i < nums.size(); i++) {
            int c[] = {nums[i], mx*nums[i], mn*nums[i]};
            mx = max({c[0], c[1], c[2]});
            mn = min({c[0], c[1], c[2]});
            best = max(best, mx);
        }
        return best;
    }
};`,
},
  179: {
pythonCode: `class Solution:
    def largestNumber(self, nums):
        from functools import cmp_to_key
        strs = list(map(str, nums))
        strs.sort(key=cmp_to_key(lambda a, b: 1 if b + a > a + b else -1))
        if strs[0] == '0':
            return '0'
        return ''.join(strs)`,
typescriptCode: `class Solution {
  largestNumber(nums: number[]): string {
    const sorted = nums.map(String).sort((a, b) => (b + a).localeCompare(a + b));
    if (sorted[0] === "0") return "0";
    return sorted.join("");
  }
}`,
javaCode: `class Solution {
    public String largestNumber(int[] nums) {
        String[] strs = new String[nums.length];
        for (int i = 0; i < nums.length; i++) strs[i] = String.valueOf(nums[i]);
        Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));
        if (strs[0].equals("0")) return "0";
        StringBuilder sb = new StringBuilder();
        for (String s : strs) sb.append(s);
        return sb.toString();
    }
}`,
cppCode: `class Solution {
public:
    string largestNumber(vector<int>& nums) {
        vector<string> strs;
        for (int n : nums) strs.push_back(to_string(n));
        sort(strs.begin(), strs.end(), [](string& a, string& b) { return a+b > b+a; });
        if (strs[0] == "0") return "0";
        string result;
        for (auto& s : strs) result += s;
        return result;
    }
};`,
},
  203: {
pythonCode: `class Solution:
    def removeElements(self, head, val):
        dummy = ListNode(0, head)
        prev = dummy
        current = head
        while current:
            if current.val == val:
                prev.next = current.next
            else:
                prev = current
            current = current.next
        return dummy.next`,
typescriptCode: `class Solution {
  removeElements(head: ListNode | null, val: number): ListNode | null {
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
javaCode: `class Solution {
    public ListNode removeElements(ListNode head, int val) {
        ListNode dummy = new ListNode(0, head);
        ListNode prev = dummy, curr = head;
        while (curr != null) {
            if (curr.val == val) prev.next = curr.next;
            else prev = curr;
            curr = curr.next;
        }
        return dummy.next;
    }
}`,
cppCode: `class Solution {
public:
    ListNode* removeElements(ListNode* head, int val) {
        ListNode dummy(0, head);
        ListNode *prev = &dummy, *curr = head;
        while (curr) {
            if (curr->val == val) prev->next = curr->next;
            else prev = curr;
            curr = curr->next;
        }
        return dummy.next;
    }
};`,
},
  206: {
pythonCode: `class Solution:
    def reverseList(self, head):
        prev = None
        current = head
        while current is not None:
            nxt = current.next
            current.next = prev
            prev = current
            current = nxt
        return prev`,
typescriptCode: `class Solution {
  reverseList(head: ListNode | null): ListNode | null {
    let prev: ListNode | null = null;
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
javaCode: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
}`,
cppCode: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr) {
            ListNode* next = curr->next;
            curr->next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
};`,
},
  213: {
pythonCode: `class Solution:
    def rob(self, nums):
        if len(nums) == 1:
            return nums[0]

        def rob_range(start, end):
            prev = 0
            current = 0
            for i in range(start, end + 1):
                nxt = max(current, prev + nums[i])
                prev = current
                current = nxt
            return current

        return max(rob_range(0, len(nums) - 2), rob_range(1, len(nums) - 1))`,
typescriptCode: `class Solution {
  rob(nums: number[]): number {
    if (nums.length === 1) return nums[0];
    const robRange = (start: number, end: number): number => {
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
javaCode: `class Solution {
    public int rob(int[] nums) {
        if (nums.length == 1) return nums[0];
        return Math.max(robRange(nums, 0, nums.length-2), robRange(nums, 1, nums.length-1));
    }
    private int robRange(int[] nums, int start, int end) {
        int prev = 0, curr = 0;
        for (int i = start; i <= end; i++) {
            int next = Math.max(curr, prev + nums[i]);
            prev = curr;
            curr = next;
        }
        return curr;
    }
}`,
cppCode: `class Solution {
public:
    int rob(vector<int>& nums) {
        if (nums.size() == 1) return nums[0];
        auto rr = [&](int s, int e) {
            int prev = 0, cur = 0;
            for (int i = s; i <= e; i++) { int nxt = max(cur, prev+nums[i]); prev = cur; cur = nxt; }
            return cur;
        };
        return max(rr(0, nums.size()-2), rr(1, nums.size()-1));
    }
};`,
},
  217: {
pythonCode: `class Solution:
    def containsDuplicate(self, nums):
        return len(set(nums)) != len(nums)`,
typescriptCode: `class Solution {
  containsDuplicate(nums: number[]): boolean {
    return new Set(nums).size !== nums.length;
  }
}`,
javaCode: `class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int num : nums) {
            if (!seen.add(num)) return true;
        }
        return false;
    }
}`,
cppCode: `class Solution {
public:
    bool containsDuplicate(vector<int>& nums) {
        unordered_set<int> seen(nums.begin(), nums.end());
        return seen.size() != nums.size();
    }
};`,
},
  234: {
pythonCode: `class Solution:
    def isPalindrome(self, head):
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        prev = None
        while slow:
            nxt = slow.next
            slow.next = prev
            prev = slow
            slow = nxt
        left, right = head, prev
        while right:
            if left.val != right.val:
                return False
            left = left.next
            right = right.next
        return True`,
typescriptCode: `class Solution {
  isPalindrome(head: ListNode | null): boolean {
    let slow: any = head;
    let fast: any = head;
    while (fast !== null && fast.next !== null) {
      slow = slow.next;
      fast = fast.next.next;
    }
    let prev: ListNode | null = null;
    let current: any = slow;
    while (current !== null) {
      const next = current.next;
      current.next = prev;
      prev = current;
      current = next;
    }
    let left: any = head;
    let right = prev;
    while (right !== null) {
      if (left.val !== right.val) return false;
      left = left.next;
      right = right.next;
    }
    return true;
  }
}`,
javaCode: `class Solution {
    public boolean isPalindrome(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode prev = null;
        while (slow != null) {
            ListNode next = slow.next;
            slow.next = prev;
            prev = slow;
            slow = next;
        }
        ListNode left = head, right = prev;
        while (right != null) {
            if (left.val != right.val) return false;
            left = left.next;
            right = right.next;
        }
        return true;
    }
}`,
cppCode: `class Solution {
public:
    bool isPalindrome(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
        ListNode *prev = nullptr;
        while (slow) { ListNode* nxt = slow->next; slow->next = prev; prev = slow; slow = nxt; }
        ListNode *l = head, *r = prev;
        while (r) { if (l->val != r->val) return false; l = l->next; r = r->next; }
        return true;
    }
};`,
},
  235: {
pythonCode: `class Solution:
    def lowestCommonAncestor(self, root, p, q):
        node = root
        while node:
            if p < node.val and q < node.val:
                node = node.left
            elif p > node.val and q > node.val:
                node = node.right
            else:
                return node
        return None`,
typescriptCode: `class Solution {
  lowestCommonAncestor(root: TreeNode | null, p: number, q: number): TreeNode | null {
    let node = root;
    while (node !== null) {
      if (p < node.val && q < node.val) node = node.left;
      else if (p > node.val && q > node.val) node = node.right;
      else return node;
    }
    return null;
  }
}`,
javaCode: `class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, int p, int q) {
        TreeNode node = root;
        while (node != null) {
            if (p < node.val && q < node.val) node = node.left;
            else if (p > node.val && q > node.val) node = node.right;
            else return node;
        }
        return null;
    }
}`,
cppCode: `class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, int p, int q) {
        TreeNode* node = root;
        while (node) {
            if (p < node->val && q < node->val) node = node->left;
            else if (p > node->val && q > node->val) node = node->right;
            else return node;
        }
        return nullptr;
    }
};`,
},
  252: {
pythonCode: `class Solution:
    def canAttendMeetings(self, intervals):
        sorted_intervals = sorted(intervals, key=lambda x: x[0])
        for i in range(1, len(sorted_intervals)):
            if sorted_intervals[i][0] < sorted_intervals[i - 1][1]:
                return False
        return True`,
typescriptCode: `class Solution {
  canAttendMeetings(intervals: number[][]): boolean {
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i][0] < sorted[i - 1][1]) return false;
    }
    return true;
  }
}`,
javaCode: `class Solution {
    public boolean canAttendMeetings(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < intervals[i-1][1]) return false;
        }
        return true;
    }
}`,
cppCode: `class Solution {
public:
    bool canAttendMeetings(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(), [](auto& a, auto& b){ return a[0]<b[0]; });
        for (int i = 1; i < intervals.size(); i++)
            if (intervals[i][0] < intervals[i-1][1]) return false;
        return true;
    }
};`,
},
  253: {
pythonCode: `class Solution:
    def minMeetingRooms(self, intervals):
        starts = sorted([i[0] for i in intervals])
        ends = sorted([i[1] for i in intervals])
        rooms = 0
        end_idx = 0
        for start in starts:
            if start < ends[end_idx]:
                rooms += 1
            else:
                end_idx += 1
        return rooms`,
typescriptCode: `class Solution {
  minMeetingRooms(intervals: number[][]): number {
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
javaCode: `class Solution {
    public int minMeetingRooms(int[][] intervals) {
        int[] starts = new int[intervals.length], ends = new int[intervals.length];
        for (int i = 0; i < intervals.length; i++) { starts[i] = intervals[i][0]; ends[i] = intervals[i][1]; }
        Arrays.sort(starts); Arrays.sort(ends);
        int rooms = 0, endIdx = 0;
        for (int start : starts) {
            if (start < ends[endIdx]) rooms++;
            else endIdx++;
        }
        return rooms;
    }
}`,
cppCode: `class Solution {
public:
    int minMeetingRooms(vector<vector<int>>& intervals) {
        vector<int> starts, ends;
        for (auto& i : intervals) { starts.push_back(i[0]); ends.push_back(i[1]); }
        sort(starts.begin(), starts.end());
        sort(ends.begin(), ends.end());
        int rooms = 0, endIdx = 0;
        for (int s : starts) {
            if (s < ends[endIdx]) rooms++;
            else endIdx++;
        }
        return rooms;
    }
};`,
},
  263: {
pythonCode: `class Solution:
    def isUgly(self, n):
        if n <= 0:
            return False
        for factor in [2, 3, 5]:
            while n % factor == 0:
                n //= factor
        return n == 1`,
typescriptCode: `class Solution {
  isUgly(n: number): boolean {
    if (n <= 0) return false;
    for (const factor of [2, 3, 5]) {
      while (n % factor === 0) n = n / factor;
    }
    return n === 1;
  }
}`,
javaCode: `class Solution {
    public boolean isUgly(int n) {
        if (n <= 0) return false;
        for (int factor : new int[]{2, 3, 5}) {
            while (n % factor == 0) n /= factor;
        }
        return n == 1;
    }
}`,
cppCode: `class Solution {
public:
    bool isUgly(int n) {
        if (n <= 0) return false;
        for (int f : {2, 3, 5}) while (n % f == 0) n /= f;
        return n == 1;
    }
};`,
},
  268: {
pythonCode: `class Solution:
    def missingNumber(self, nums):
        n = len(nums)
        total = n * (n + 1) // 2
        for num in nums:
            total -= num
        return total`,
typescriptCode: `class Solution {
  missingNumber(nums: number[]): number {
    const n = nums.length;
    let total = (n * (n + 1)) / 2;
    for (const num of nums) total -= num;
    return total;
  }
}`,
javaCode: `class Solution {
    public int missingNumber(int[] nums) {
        int n = nums.length;
        int total = n * (n + 1) / 2;
        for (int num : nums) total -= num;
        return total;
    }
}`,
cppCode: `class Solution {
public:
    int missingNumber(vector<int>& nums) {
        int n = nums.size();
        int total = n * (n + 1) / 2;
        for (int num : nums) total -= num;
        return total;
    }
};`,
},
  279: {
pythonCode: `class Solution:
    def numSquares(self, n):
        dp = [float('inf')] * (n + 1)
        dp[0] = 0
        for i in range(1, n + 1):
            s = 1
            while s * s <= i:
                dp[i] = min(dp[i], dp[i - s * s] + 1)
                s += 1
        return dp[n]`,
typescriptCode: `class Solution {
  numSquares(n: number): number {
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
javaCode: `class Solution {
    public int numSquares(int n) {
        int[] dp = new int[n + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int i = 1; i <= n; i++) {
            for (int s = 1; s * s <= i; s++) {
                dp[i] = Math.min(dp[i], dp[i - s * s] + 1);
            }
        }
        return dp[n];
    }
}`,
cppCode: `class Solution {
public:
    int numSquares(int n) {
        vector<int> dp(n+1, INT_MAX);
        dp[0] = 0;
        for (int i = 1; i <= n; i++)
            for (int s = 1; s*s <= i; s++)
                dp[i] = min(dp[i], dp[i-s*s]+1);
        return dp[n];
    }
};`,
},
  283: {
pythonCode: `class Solution:
    def moveZeroes(self, nums):
        write = 0
        for read in range(len(nums)):
            if nums[read] != 0:
                nums[write] = nums[read]
                write += 1
        for i in range(write, len(nums)):
            nums[i] = 0`,
typescriptCode: `class Solution {
  moveZeroes(nums: number[]): void {
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
javaCode: `class Solution {
    public void moveZeroes(int[] nums) {
        int write = 0;
        for (int read = 0; read < nums.length; read++) {
            if (nums[read] != 0) {
                nums[write] = nums[read];
                write++;
            }
        }
        for (int i = write; i < nums.length; i++) nums[i] = 0;
    }
}`,
cppCode: `class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int write = 0;
        for (int read = 0; read < nums.size(); read++) {
            if (nums[read] != 0) nums[write++] = nums[read];
        }
        for (int i = write; i < nums.size(); i++) nums[i] = 0;
    }
};`,
},
  338: {
pythonCode: `class Solution:
    def countBits(self, n):
        result = [0] * (n + 1)
        for i in range(1, n + 1):
            result[i] = result[i >> 1] + (i & 1)
        return result`,
typescriptCode: `class Solution {
  countBits(n: number): number[] {
    const result = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      result[i] = result[i >> 1] + (i & 1);
    }
    return result;
  }
}`,
javaCode: `class Solution {
    public int[] countBits(int n) {
        int[] result = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            result[i] = result[i >> 1] + (i & 1);
        }
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> countBits(int n) {
        vector<int> result(n + 1);
        for (int i = 1; i <= n; i++)
            result[i] = result[i >> 1] + (i & 1);
        return result;
    }
};`,
},
  344: {
pythonCode: `class Solution:
    def reverseString(self, s):
        left, right = 0, len(s) - 1
        while left < right:
            s[left], s[right] = s[right], s[left]
            left += 1
            right -= 1`,
typescriptCode: `class Solution {
  reverseString(s: string[]): void {
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
javaCode: `class Solution {
    public void reverseString(char[] s) {
        int left = 0, right = s.length - 1;
        while (left < right) {
            char temp = s[left];
            s[left] = s[right];
            s[right] = temp;
            left++;
            right--;
        }
    }
}`,
cppCode: `class Solution {
public:
    void reverseString(vector<char>& s) {
        int left = 0, right = s.size() - 1;
        while (left < right) {
            swap(s[left++], s[right--]);
        }
    }
};`,
},
  347: {
pythonCode: `class Solution:
    def topKFrequent(self, nums, k):
        counts = {}
        for num in nums:
            counts[num] = counts.get(num, 0) + 1
        buckets = [[] for _ in range(len(nums) + 1)]
        for num, count in counts.items():
            buckets[count].append(num)
        result = []
        for i in range(len(buckets) - 1, -1, -1):
            for num in buckets[i]:
                result.append(num)
                if len(result) == k:
                    return result
        return result`,
typescriptCode: `class Solution {
  topKFrequent(nums: number[], k: number): number[] {
    const counts = new Map<number, number>();
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
javaCode: `class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int num : nums) counts.put(num, counts.getOrDefault(num, 0) + 1);
        List<List<Integer>> buckets = new ArrayList<>(nums.length + 1);
        for (int i = 0; i <= nums.length; i++) buckets.add(new ArrayList<>());
        for (Map.Entry<Integer, Integer> e : counts.entrySet()) buckets.get(e.getValue()).add(e.getKey());
        int[] result = new int[k];
        int idx = 0;
        for (int i = buckets.size() - 1; i >= 0 && idx < k; i--) {
            for (int num : buckets.get(i)) {
                if (idx < k) result[idx++] = num;
            }
        }
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k) {
        unordered_map<int,int> counts;
        for (int num : nums) counts[num]++;
        vector<vector<int>> buckets(nums.size()+1);
        for (auto& [num, count] : buckets.resize(0), counts) buckets[count].push_back(num);
        vector<int> result;
        for (int i = buckets.size()-1; i >= 0 && result.size() < k; i--) {
            for (int num : buckets[i]) {
                result.push_back(num);
                if (result.size() == k) break;
            }
        }
        return result;
    }
};`,
},
  367: {
pythonCode: `class Solution:
    def isPerfectSquare(self, num):
        left, right = 1, num
        while left <= right:
            mid = (left + right) // 2
            square = mid * mid
            if square == num:
                return True
            elif square < num:
                left = mid + 1
            else:
                right = mid - 1
        return False`,
typescriptCode: `class Solution {
  isPerfectSquare(num: number): boolean {
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
javaCode: `class Solution {
    public boolean isPerfectSquare(int num) {
        int left = 1, right = num;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            long square = (long) mid * mid;
            if (square == num) return true;
            else if (square < num) left = mid + 1;
            else right = mid - 1;
        }
        return false;
    }
}`,
cppCode: `class Solution {
public:
    bool isPerfectSquare(int num) {
        long left = 1, right = num;
        while (left <= right) {
            long mid = (left + right) / 2;
            long square = mid * mid;
            if (square == num) return true;
            if (square < num) left = mid + 1;
            else right = mid - 1;
        }
        return false;
    }
};`,
},
  371: {
pythonCode: `class Solution:
    def getSum(self, a, b):
        MASK = 0xFFFFFFFF
        MAX = 0x7FFFFFFF
        while b != 0:
            carry = (a & b) & MASK
            a = (a ^ b) & MASK
            b = carry << 1 & MASK
        return a if a <= MAX else ~(a ^ MASK)`,
typescriptCode: `class Solution {
  getSum(a: number, b: number): number {
    while (b !== 0) {
      const carry = (a & b) << 1;
      a = a ^ b;
      b = carry;
    }
    return a;
  }
}`,
javaCode: `class Solution {
    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;
            a = a ^ b;
            b = carry;
        }
        return a;
    }
}`,
cppCode: `class Solution {
public:
    int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;
            a = a ^ b;
            b = carry;
        }
        return a;
    }
};`,
},
  416: {
pythonCode: `class Solution:
    def canPartition(self, nums):
        total = sum(nums)
        if total % 2 != 0:
            return False
        target = total // 2
        possible = [False] * (target + 1)
        possible[0] = True
        for num in nums:
            for s in range(target, num - 1, -1):
                if possible[s - num]:
                    possible[s] = True
        return possible[target]`,
typescriptCode: `class Solution {
  canPartition(nums: number[]): boolean {
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
javaCode: `class Solution {
    public boolean canPartition(int[] nums) {
        int total = 0;
        for (int num : nums) total += num;
        if (total % 2 != 0) return false;
        int target = total / 2;
        boolean[] possible = new boolean[target + 1];
        possible[0] = true;
        for (int num : nums) {
            for (int s = target; s >= num; s--) {
                if (possible[s - num]) possible[s] = true;
            }
        }
        return possible[target];
    }
}`,
cppCode: `class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        if (total % 2) return false;
        int target = total / 2;
        vector<bool> possible(target+1, false);
        possible[0] = true;
        for (int num : nums)
            for (int s = target; s >= num; s--)
                if (possible[s-num]) possible[s] = true;
        return possible[target];
    }
};`,
},
  424: {
pythonCode: `class Solution:
    def characterReplacement(self, s, k):
        counts = [0] * 26
        left = 0
        best = 0
        max_count = 0
        for right in range(len(s)):
            idx = ord(s[right]) - ord('A')
            counts[idx] += 1
            max_count = max(max_count, counts[idx])
            if right - left + 1 - max_count > k:
                counts[ord(s[left]) - ord('A')] -= 1
                left += 1
            best = max(best, right - left + 1)
        return best`,
typescriptCode: `class Solution {
  characterReplacement(s: string, k: number): number {
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
javaCode: `class Solution {
    public int characterReplacement(String s, int k) {
        int[] counts = new int[26];
        int left = 0, best = 0, maxCount = 0;
        for (int right = 0; right < s.length(); right++) {
            int idx = s.charAt(right) - 'A';
            counts[idx]++;
            maxCount = Math.max(maxCount, counts[idx]);
            if (right - left + 1 - maxCount > k) {
                counts[s.charAt(left) - 'A']--;
                left++;
            }
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}`,
cppCode: `class Solution {
public:
    int characterReplacement(string s, int k) {
        int counts[26] = {}, left = 0, best = 0, maxCount = 0;
        for (int right = 0; right < s.size(); right++) {
            maxCount = max(maxCount, ++counts[s[right]-'A']);
            if (right - left + 1 - maxCount > k) counts[s[left++]-'A']--;
            best = max(best, right - left + 1);
        }
        return best;
    }
};`,
},
  435: {
pythonCode: `class Solution:
    def eraseOverlapIntervals(self, intervals):
        sorted_intervals = sorted(intervals, key=lambda x: x[1])
        keep = 0
        end = float('-inf')
        for start, finish in sorted_intervals:
            if start >= end:
                keep += 1
                end = finish
        return len(intervals) - keep`,
typescriptCode: `class Solution {
  eraseOverlapIntervals(intervals: number[][]): number {
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
javaCode: `class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[1] - b[1]);
        int keep = 0;
        int end = Integer.MIN_VALUE;
        for (int[] inv : intervals) {
            if (inv[0] >= end) { keep++; end = inv[1]; }
        }
        return intervals.length - keep;
    }
}`,
cppCode: `class Solution {
public:
    int eraseOverlapIntervals(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(), [](auto& a, auto& b){ return a[1]<b[1]; });
        int keep = 0, end = INT_MIN;
        for (auto& inv : intervals) {
            if (inv[0] >= end) { keep++; end = inv[1]; }
        }
        return intervals.size() - keep;
    }
};`,
},
  438: {
pythonCode: `class Solution:
    def findAnagrams(self, s, p):
        result = []
        need = [0] * 26
        for ch in p:
            need[ord(ch) - ord('a')] += 1
        window = [0] * 26
        for right in range(len(s)):
            window[ord(s[right]) - ord('a')] += 1
            left = right - len(p) + 1
            if left > 0:
                window[ord(s[left - 1]) - ord('a')] -= 1
            if left >= 0 and need == window:
                result.append(left)
        return result`,
typescriptCode: `class Solution {
  findAnagrams(s: string, p: string): number[] {
    const result: number[] = [];
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
  equal(a: number[], b: number[]): boolean {
    for (let i = 0; i < 26; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}`,
javaCode: `class Solution {
    public List<Integer> findAnagrams(String s, String p) {
        List<Integer> result = new ArrayList<>();
        int[] need = new int[26], window = new int[26];
        for (char ch : p.toCharArray()) need[ch - 'a']++;
        for (int right = 0; right < s.length(); right++) {
            window[s.charAt(right) - 'a']++;
            int left = right - p.length() + 1;
            if (left > 0) window[s.charAt(left - 1) - 'a']--;
            if (left >= 0 && Arrays.equals(need, window)) result.add(left);
        }
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> findAnagrams(string s, string p) {
        vector<int> result;
        int need[26] = {}, window[26] = {};
        for (char ch : p) need[ch-'a']++;
        for (int right = 0; right < s.size(); right++) {
            window[s[right]-'a']++;
            int left = right - p.size() + 1;
            if (left > 0) window[s[left-1]-'a']--;
            if (left >= 0 && equal(begin(need), end(need), begin(window)))
                result.push_back(left);
        }
        return result;
    }
};`,
},
  441: {
pythonCode: `class Solution:
    def arrangeCoins(self, n):
        left, right = 1, n
        while left <= right:
            mid = (left + right) // 2
            used = mid * (mid + 1) // 2
            if used <= n:
                left = mid + 1
            else:
                right = mid - 1
        return right`,
typescriptCode: `class Solution {
  arrangeCoins(n: number): number {
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
javaCode: `class Solution {
    public int arrangeCoins(int n) {
        long left = 1, right = n;
        while (left <= right) {
            long mid = (left + right) / 2;
            long used = mid * (mid + 1) / 2;
            if (used <= n) left = mid + 1;
            else right = mid - 1;
        }
        return (int) right;
    }
}`,
cppCode: `class Solution {
public:
    int arrangeCoins(int n) {
        long left = 1, right = n;
        while (left <= right) {
            long mid = (left+right)/2;
            long used = mid*(mid+1)/2;
            if (used <= n) left = mid+1;
            else right = mid-1;
        }
        return (int)right;
    }
};`,
},
  448: {
pythonCode: `class Solution:
    def findDisappearedNumbers(self, nums):
        for num in nums:
            index = abs(num) - 1
            if nums[index] > 0:
                nums[index] = -nums[index]
        result = []
        for i in range(len(nums)):
            if nums[i] > 0:
                result.append(i + 1)
        return result`,
typescriptCode: `class Solution {
  findDisappearedNumbers(nums: number[]): number[] {
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
javaCode: `class Solution {
    public List<Integer> findDisappearedNumbers(int[] nums) {
        for (int num : nums) {
            int index = Math.abs(num) - 1;
            if (nums[index] > 0) nums[index] = -nums[index];
        }
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] > 0) result.add(i + 1);
        }
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> findDisappearedNumbers(vector<int>& nums) {
        for (int num : nums) {
            int index = abs(num) - 1;
            if (nums[index] > 0) nums[index] = -nums[index];
        }
        vector<int> result;
        for (int i = 0; i < nums.size(); i++) {
            if (nums[i] > 0) result.push_back(i + 1);
        }
        return result;
    }
};`,
},
  450: {
pythonCode: `class Solution:
    def deleteNode(self, root, key):
        if not root:
            return None
        if key < root.val:
            root.left = self.deleteNode(root.left, key)
        elif key > root.val:
            root.right = self.deleteNode(root.right, key)
        else:
            if not root.left:
                return root.right
            if not root.right:
                return root.left
            successor = root.right
            while successor.left:
                successor = successor.left
            root.val = successor.val
            root.right = self.deleteNode(root.right, successor.val)
        return root`,
typescriptCode: `class Solution {
  deleteNode(root: TreeNode | null, key: number): TreeNode | null {
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
javaCode: `class Solution {
    public TreeNode deleteNode(TreeNode root, int key) {
        if (root == null) return null;
        if (key < root.val) root.left = deleteNode(root.left, key);
        else if (key > root.val) root.right = deleteNode(root.right, key);
        else {
            if (root.left == null) return root.right;
            if (root.right == null) return root.left;
            TreeNode successor = root.right;
            while (successor.left != null) successor = successor.left;
            root.val = successor.val;
            root.right = deleteNode(root.right, successor.val);
        }
        return root;
    }
}`,
cppCode: `class Solution {
public:
    TreeNode* deleteNode(TreeNode* root, int key) {
        if (!root) return nullptr;
        if (key < root->val) root->left = deleteNode(root->left, key);
        else if (key > root->val) root->right = deleteNode(root->right, key);
        else {
            if (!root->left) return root->right;
            if (!root->right) return root->left;
            TreeNode* succ = root->right;
            while (succ->left) succ = succ->left;
            root->val = succ->val;
            root->right = deleteNode(root->right, succ->val);
        }
        return root;
    }
};`,
},
  455: {
pythonCode: `class Solution:
    def findContentChildren(self, g, s):
        g.sort()
        s.sort()
        child = cookie = 0
        while child < len(g) and cookie < len(s):
            if s[cookie] >= g[child]:
                child += 1
            cookie += 1
        return child`,
typescriptCode: `class Solution {
  findContentChildren(g: number[], s: number[]): number {
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
javaCode: `class Solution {
    public int findContentChildren(int[] g, int[] s) {
        Arrays.sort(g);
        Arrays.sort(s);
        int child = 0, cookie = 0;
        while (child < g.length && cookie < s.length) {
            if (s[cookie] >= g[child]) child++;
            cookie++;
        }
        return child;
    }
}`,
cppCode: `class Solution {
public:
    int findContentChildren(vector<int>& g, vector<int>& s) {
        sort(g.begin(), g.end());
        sort(s.begin(), s.end());
        int child = 0, cookie = 0;
        while (child < g.size() && cookie < s.size()) {
            if (s[cookie] >= g[child]) child++;
            cookie++;
        }
        return child;
    }
};`,
},
  516: {
pythonCode: `class Solution:
    def longestPalindromeSubseq(self, s):
        n = len(s)
        dp = [[0] * n for _ in range(n)]
        for i in range(n - 1, -1, -1):
            dp[i][i] = 1
            for j in range(i + 1, n):
                if s[i] == s[j]:
                    dp[i][j] = dp[i + 1][j - 1] + 2
                else:
                    dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
        return dp[0][n - 1]`,
typescriptCode: `class Solution {
  longestPalindromeSubseq(s: string): number {
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
javaCode: `class Solution {
    public int longestPalindromeSubseq(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];
        for (int i = n-1; i >= 0; i--) {
            dp[i][i] = 1;
            for (int j = i+1; j < n; j++) {
                if (s.charAt(i) == s.charAt(j)) dp[i][j] = dp[i+1][j-1] + 2;
                else dp[i][j] = Math.max(dp[i+1][j], dp[i][j-1]);
            }
        }
        return dp[0][n-1];
    }
}`,
cppCode: `class Solution {
public:
    int longestPalindromeSubseq(string s) {
        int n = s.size();
        vector<vector<int>> dp(n, vector<int>(n));
        for (int i = n-1; i >= 0; i--) {
            dp[i][i] = 1;
            for (int j = i+1; j < n; j++)
                dp[i][j] = s[i]==s[j] ? dp[i+1][j-1]+2 : max(dp[i+1][j],dp[i][j-1]);
        }
        return dp[0][n-1];
    }
};`,
},
  518: {
pythonCode: `class Solution:
    def change(self, amount, coins):
        ways = [0] * (amount + 1)
        ways[0] = 1
        for coin in coins:
            for s in range(coin, amount + 1):
                ways[s] += ways[s - coin]
        return ways[amount]`,
typescriptCode: `class Solution {
  change(amount: number, coins: number[]): number {
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
javaCode: `class Solution {
    public int change(int amount, int[] coins) {
        int[] ways = new int[amount + 1];
        ways[0] = 1;
        for (int coin : coins) {
            for (int s = coin; s <= amount; s++) {
                ways[s] += ways[s - coin];
            }
        }
        return ways[amount];
    }
}`,
cppCode: `class Solution {
public:
    int change(int amount, vector<int>& coins) {
        vector<int> ways(amount+1, 0);
        ways[0] = 1;
        for (int coin : coins)
            for (int s = coin; s <= amount; s++)
                ways[s] += ways[s-coin];
        return ways[amount];
    }
};`,
},
  543: {
pythonCode: `class Solution:
    def diameterOfBinaryTree(self, root):
        best = 0

        def depth(node):
            nonlocal best
            if not node:
                return 0
            left = depth(node.left)
            right = depth(node.right)
            best = max(best, left + right)
            return 1 + max(left, right)

        depth(root)
        return best`,
typescriptCode: `class Solution {
  diameterOfBinaryTree(root: TreeNode | null): number {
    let best = 0;
    const depth = (node: TreeNode | null): number => {
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
javaCode: `class Solution {
    private int best = 0;
    public int diameterOfBinaryTree(TreeNode root) {
        depth(root);
        return best;
    }
    private int depth(TreeNode node) {
        if (node == null) return 0;
        int left = depth(node.left);
        int right = depth(node.right);
        best = Math.max(best, left + right);
        return 1 + Math.max(left, right);
    }
}`,
cppCode: `class Solution {
public:
    int best = 0;
    int diameterOfBinaryTree(TreeNode* root) { depth(root); return best; }
    int depth(TreeNode* node) {
        if (!node) return 0;
        int l = depth(node->left), r = depth(node->right);
        best = max(best, l + r);
        return 1 + max(l, r);
    }
};`,
},
  560: {
pythonCode: `class Solution:
    def subarraySum(self, nums, k):
        prefix = {0: 1}
        total = 0
        count = 0
        for num in nums:
            total += num
            count += prefix.get(total - k, 0)
            prefix[total] = prefix.get(total, 0) + 1
        return count`,
typescriptCode: `class Solution {
  subarraySum(nums: number[], k: number): number {
    const prefix = new Map<number, number>();
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
javaCode: `class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> prefix = new HashMap<>();
        prefix.put(0, 1);
        int sum = 0, count = 0;
        for (int num : nums) {
            sum += num;
            count += prefix.getOrDefault(sum - k, 0);
            prefix.put(sum, prefix.getOrDefault(sum, 0) + 1);
        }
        return count;
    }
}`,
cppCode: `class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<int,int> prefix;
        prefix[0] = 1;
        int sum = 0, count = 0;
        for (int num : nums) {
            sum += num;
            if (prefix.count(sum - k)) count += prefix[sum - k];
            prefix[sum]++;
        }
        return count;
    }
};`,
},
  567: {
pythonCode: `class Solution:
    def checkInclusion(self, s1, s2):
        if len(s1) > len(s2):
            return False
        need = [0] * 26
        for ch in s1:
            need[ord(ch) - ord('a')] += 1
        window = [0] * 26
        for right in range(len(s2)):
            window[ord(s2[right]) - ord('a')] += 1
            left = right - len(s1)
            if left >= 0:
                window[ord(s2[left]) - ord('a')] -= 1
            if right >= len(s1) - 1 and need == window:
                return True
        return False`,
typescriptCode: `class Solution {
  checkInclusion(s1: string, s2: string): boolean {
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
  equal(a: number[], b: number[]): boolean {
    for (let i = 0; i < 26; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}`,
javaCode: `class Solution {
    public boolean checkInclusion(String s1, String s2) {
        if (s1.length() > s2.length()) return false;
        int[] need = new int[26], window = new int[26];
        for (char ch : s1.toCharArray()) need[ch - 'a']++;
        for (int right = 0; right < s2.length(); right++) {
            window[s2.charAt(right) - 'a']++;
            int left = right - s1.length();
            if (left >= 0) window[s2.charAt(left) - 'a']--;
            if (right >= s1.length() - 1 && Arrays.equals(need, window)) return true;
        }
        return false;
    }
}`,
cppCode: `class Solution {
public:
    bool checkInclusion(string s1, string s2) {
        if (s1.size() > s2.size()) return false;
        int need[26] = {}, window[26] = {};
        for (char ch : s1) need[ch-'a']++;
        for (int right = 0; right < s2.size(); right++) {
            window[s2[right]-'a']++;
            int left = right - s1.size();
            if (left >= 0) window[s2[left]-'a']--;
            if (right >= (int)s1.size()-1 && equal(begin(need),end(need),begin(window)))
                return true;
        }
        return false;
    }
};`,
},
  572: {
pythonCode: `class Solution:
    def isSubtree(self, root, subRoot):
        def same(a, b):
            if not a and not b:
                return True
            if not a or not b:
                return False
            return a.val == b.val and same(a.left, b.left) and same(a.right, b.right)

        if not root:
            return False
        if same(root, subRoot):
            return True
        return self.isSubtree(root.left, subRoot) or self.isSubtree(root.right, subRoot)`,
typescriptCode: `class Solution {
  isSubtree(root: TreeNode | null, subRoot: TreeNode | null): boolean {
    if (root === null) return false;
    if (this.same(root, subRoot)) return true;
    return this.isSubtree(root.left, subRoot) || this.isSubtree(root.right, subRoot);
  }
  same(a: TreeNode | null, b: TreeNode | null): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.val === b.val && this.same(a.left, b.left) && this.same(a.right, b.right);
  }
}`,
javaCode: `class Solution {
    public boolean isSubtree(TreeNode root, TreeNode subRoot) {
        if (root == null) return false;
        if (same(root, subRoot)) return true;
        return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
    }
    private boolean same(TreeNode a, TreeNode b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.val == b.val && same(a.left, b.left) && same(a.right, b.right);
    }
}`,
cppCode: `class Solution {
public:
    bool isSubtree(TreeNode* root, TreeNode* subRoot) {
        if (!root) return false;
        if (same(root, subRoot)) return true;
        return isSubtree(root->left, subRoot) || isSubtree(root->right, subRoot);
    }
    bool same(TreeNode* a, TreeNode* b) {
        if (!a && !b) return true;
        if (!a || !b) return false;
        return a->val == b->val && same(a->left, b->left) && same(a->right, b->right);
    }
};`,
},
  606: {
pythonCode: `class Solution:
    def tree2str(self, root):
        if not root:
            return ''
        if not root.left and not root.right:
            return str(root.val)
        left = self.tree2str(root.left)
        right = self.tree2str(root.right)
        result = str(root.val) + '(' + left + ')'
        if right:
            result += '(' + right + ')'
        return result`,
typescriptCode: `class Solution {
  tree2str(root: TreeNode | null): string {
    if (root === null) return "";
    if (root.left === null && root.right === null) return String(root.val);
    const left = this.tree2str(root.left);
    const right = this.tree2str(root.right);
    let result = String(root.val) + "(" + left + ")";
    if (right !== "") result += "(" + right + ")";
    return result;
  }
}`,
javaCode: `class Solution {
    public String tree2str(TreeNode root) {
        if (root == null) return "";
        if (root.left == null && root.right == null) return String.valueOf(root.val);
        String left = tree2str(root.left);
        String right = tree2str(root.right);
        String result = root.val + "(" + left + ")";
        if (!right.isEmpty()) result += "(" + right + ")";
        return result;
    }
}`,
cppCode: `class Solution {
public:
    string tree2str(TreeNode* root) {
        if (!root) return "";
        if (!root->left && !root->right) return to_string(root->val);
        string left = tree2str(root->left);
        string right = tree2str(root->right);
        string result = to_string(root->val) + "(" + left + ")";
        if (!right.empty()) result += "(" + right + ")";
        return result;
    }
};`,
},
  617: {
pythonCode: `class Solution:
    def mergeTrees(self, root1, root2):
        if not root1:
            return root2
        if not root2:
            return root1
        root1.val += root2.val
        root1.left = self.mergeTrees(root1.left, root2.left)
        root1.right = self.mergeTrees(root1.right, root2.right)
        return root1`,
typescriptCode: `class Solution {
  mergeTrees(root1: TreeNode | null, root2: TreeNode | null): TreeNode | null {
    if (root1 === null) return root2;
    if (root2 === null) return root1;
    root1.val += root2.val;
    root1.left = this.mergeTrees(root1.left, root2.left);
    root1.right = this.mergeTrees(root1.right, root2.right);
    return root1;
  }
}`,
javaCode: `class Solution {
    public TreeNode mergeTrees(TreeNode root1, TreeNode root2) {
        if (root1 == null) return root2;
        if (root2 == null) return root1;
        root1.val += root2.val;
        root1.left = mergeTrees(root1.left, root2.left);
        root1.right = mergeTrees(root1.right, root2.right);
        return root1;
    }
}`,
cppCode: `class Solution {
public:
    TreeNode* mergeTrees(TreeNode* root1, TreeNode* root2) {
        if (!root1) return root2;
        if (!root2) return root1;
        root1->val += root2->val;
        root1->left = mergeTrees(root1->left, root2->left);
        root1->right = mergeTrees(root1->right, root2->right);
        return root1;
    }
};`,
},
  621: {
pythonCode: `class Solution:
    def leastInterval(self, tasks, n):
        counts = [0] * 26
        for task in tasks:
            counts[ord(task) - ord('A')] += 1
        max_count = max(counts)
        max_tasks = counts.count(max_count)
        return max(len(tasks), (max_count - 1) * (n + 1) + max_tasks)`,
typescriptCode: `class Solution {
  leastInterval(tasks: string[], n: number): number {
    const counts = new Array(26).fill(0);
    for (const task of tasks) counts[task.charCodeAt(0) - 65]++;
    const maxCount = Math.max(...counts);
    const maxTasks = counts.filter((count) => count === maxCount).length;
    return Math.max(tasks.length, (maxCount - 1) * (n + 1) + maxTasks);
  }
}`,
javaCode: `class Solution {
    public int leastInterval(char[] tasks, int n) {
        int[] counts = new int[26];
        for (char task : tasks) counts[task - 'A']++;
        int maxCount = 0;
        for (int c : counts) maxCount = Math.max(maxCount, c);
        int maxTasks = 0;
        for (int c : counts) if (c == maxCount) maxTasks++;
        return Math.max(tasks.length, (maxCount - 1) * (n + 1) + maxTasks);
    }
}`,
cppCode: `class Solution {
public:
    int leastInterval(vector<char>& tasks, int n) {
        int counts[26] = {};
        for (char t : tasks) counts[t-'A']++;
        int mx = *max_element(counts, counts+26);
        int mxTasks = count(counts, counts+26, mx);
        return max((int)tasks.size(), (mx-1)*(n+1)+mxTasks);
    }
};`,
},
  680: {
pythonCode: `class Solution:
    def validPalindrome(self, s):
        def is_palindrome(left, right):
            while left < right:
                if s[left] != s[right]:
                    return False
                left += 1
                right -= 1
            return True

        left, right = 0, len(s) - 1
        while left < right:
            if s[left] != s[right]:
                return is_palindrome(left + 1, right) or is_palindrome(left, right - 1)
            left += 1
            right -= 1
        return True`,
typescriptCode: `class Solution {
  validPalindrome(s: string): boolean {
    const isPalindrome = (left: number, right: number): boolean => {
      while (left < right) {
        if (s[left] !== s[right]) return false;
        left++;
        right--;
      }
      return true;
    };
    let left = 0;
    let right = s.length - 1;
    while (left < right) {
      if (s[left] !== s[right]) {
        return isPalindrome(left + 1, right) || isPalindrome(left, right - 1);
      }
      left++;
      right--;
    }
    return true;
  }
}`,
javaCode: `class Solution {
    public boolean validPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) {
                return isPalindrome(s, left + 1, right) || isPalindrome(s, left, right - 1);
            }
            left++;
            right--;
        }
        return true;
    }
    private boolean isPalindrome(String s, int left, int right) {
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) return false;
            left++;
            right--;
        }
        return true;
    }
}`,
cppCode: `class Solution {
public:
    bool validPalindrome(string s) {
        int left = 0, right = s.size() - 1;
        while (left < right) {
            if (s[left] != s[right]) {
                return check(s, left+1, right) || check(s, left, right-1);
            }
            left++;
            right--;
        }
        return true;
    }
    bool check(string& s, int l, int r) {
        while (l < r) {
            if (s[l++] != s[r--]) return false;
        }
        return true;
    }
};`,
},
  682: {
pythonCode: `class Solution:
    def calPoints(self, operations):
        stack = []
        for op in operations:
            if op == 'C':
                stack.pop()
            elif op == 'D':
                stack.append(stack[-1] * 2)
            elif op == '+':
                stack.append(stack[-1] + stack[-2])
            else:
                stack.append(int(op))
        return sum(stack)`,
typescriptCode: `class Solution {
  calPoints(operations: string[]): number {
    const stack: number[] = [];
    for (const op of operations) {
      if (op === "C") stack.pop();
      else if (op === "D") stack.push(stack[stack.length - 1] * 2);
      else if (op === "+") stack.push(stack[stack.length - 1] + stack[stack.length - 2]);
      else stack.push(Number(op));
    }
    return stack.reduce((sum, value) => sum + value, 0);
  }
}`,
javaCode: `class Solution {
    public int calPoints(String[] operations) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String op : operations) {
            if (op.equals("C")) stack.pop();
            else if (op.equals("D")) stack.push(stack.peek() * 2);
            else if (op.equals("+")) {
                int a = stack.pop();
                int b = stack.peek();
                stack.push(a);
                stack.push(a + b);
            } else stack.push(Integer.parseInt(op));
        }
        int sum = 0;
        for (int v : stack) sum += v;
        return sum;
    }
}`,
cppCode: `class Solution {
public:
    int calPoints(vector<string>& operations) {
        vector<int> stack;
        for (auto& op : operations) {
            if (op == "C") stack.pop_back();
            else if (op == "D") stack.push_back(stack.back()*2);
            else if (op == "+") stack.push_back(stack.back()+stack[stack.size()-2]);
            else stack.push_back(stoi(op));
        }
        return accumulate(stack.begin(), stack.end(), 0);
    }
};`,
},
  701: {
pythonCode: `class Solution:
    def insertIntoBST(self, root, val):
        if not root:
            return TreeNode(val)
        if val < root.val:
            root.left = self.insertIntoBST(root.left, val)
        else:
            root.right = self.insertIntoBST(root.right, val)
        return root`,
typescriptCode: `class Solution {
  insertIntoBST(root: TreeNode | null, val: number): TreeNode | null {
    if (root === null) return new TreeNode(val);
    if (val < root.val) root.left = this.insertIntoBST(root.left, val);
    else root.right = this.insertIntoBST(root.right, val);
    return root;
  }
}`,
javaCode: `class Solution {
    public TreeNode insertIntoBST(TreeNode root, int val) {
        if (root == null) return new TreeNode(val);
        if (val < root.val) root.left = insertIntoBST(root.left, val);
        else root.right = insertIntoBST(root.right, val);
        return root;
    }
}`,
cppCode: `class Solution {
public:
    TreeNode* insertIntoBST(TreeNode* root, int val) {
        if (!root) return new TreeNode(val);
        if (val < root->val) root->left = insertIntoBST(root->left, val);
        else root->right = insertIntoBST(root->right, val);
        return root;
    }
};`,
},
  704: {
pythonCode: `class Solution:
    def search(self, nums, target):
        left, right = 0, len(nums) - 1
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1
        return -1`,
typescriptCode: `class Solution {
  search(nums: number[], target: number): number {
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
javaCode: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = (left + right) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`,
cppCode: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = nums.size() - 1;
        while (left <= right) {
            int mid = (left + right) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
};`,
},
  735: {
pythonCode: `class Solution:
    def asteroidCollision(self, asteroids):
        stack = []
        for asteroid in asteroids:
            alive = True
            while alive and asteroid < 0 and stack and stack[-1] > 0:
                top = stack[-1]
                if top < -asteroid:
                    stack.pop()
                elif top == -asteroid:
                    stack.pop()
                    alive = False
                else:
                    alive = False
            if alive:
                stack.append(asteroid)
        return stack`,
typescriptCode: `class Solution {
  asteroidCollision(asteroids: number[]): number[] {
    const stack: number[] = [];
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
javaCode: `class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int ast : asteroids) {
            boolean alive = true;
            while (alive && ast < 0 && !stack.isEmpty() && stack.peek() > 0) {
                int top = stack.peek();
                if (top < -ast) stack.pop();
                else if (top == -ast) { stack.pop(); alive = false; }
                else alive = false;
            }
            if (alive) stack.push(ast);
        }
        int[] result = new int[stack.size()];
        int i = stack.size() - 1;
        for (int v : stack) result[i--] = v;
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> asteroidCollision(vector<int>& asteroids) {
        vector<int> stack;
        for (int ast : asteroids) {
            bool alive = true;
            while (alive && ast < 0 && !stack.empty() && stack.back() > 0) {
                if (stack.back() < -ast) stack.pop_back();
                else if (stack.back() == -ast) { stack.pop_back(); alive = false; }
                else alive = false;
            }
            if (alive) stack.push_back(ast);
        }
        return stack;
    }
};`,
},
  739: {
pythonCode: `class Solution:
    def dailyTemperatures(self, temperatures):
        result = [0] * len(temperatures)
        stack = []
        for i in range(len(temperatures)):
            while stack and temperatures[i] > temperatures[stack[-1]]:
                index = stack.pop()
                result[index] = i - index
            stack.append(i)
        return result`,
typescriptCode: `class Solution {
  dailyTemperatures(temperatures: number[]): number[] {
    const result = new Array(temperatures.length).fill(0);
    const stack: number[] = [];
    for (let i = 0; i < temperatures.length; i++) {
      while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
        const index = stack.pop()!;
        result[index] = i - index;
      }
      stack.push(i);
    }
    return result;
  }
}`,
javaCode: `class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int[] result = new int[temperatures.length];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < temperatures.length; i++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int index = stack.pop();
                result[index] = i - index;
            }
            stack.push(i);
        }
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> dailyTemperatures(vector<int>& temperatures) {
        vector<int> result(temperatures.size());
        vector<int> stack;
        for (int i = 0; i < temperatures.size(); i++) {
            while (!stack.empty() && temperatures[i] > temperatures[stack.back()]) {
                int idx = stack.back(); stack.pop_back();
                result[idx] = i - idx;
            }
            stack.push_back(i);
        }
        return result;
    }
};`,
},
  746: {
pythonCode: `class Solution:
    def minCostClimbingStairs(self, cost):
        prev = 0
        current = 0
        for i in range(2, len(cost) + 1):
            nxt = min(current + cost[i - 1], prev + cost[i - 2])
            prev = current
            current = nxt
        return current`,
typescriptCode: `class Solution {
  minCostClimbingStairs(cost: number[]): number {
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
javaCode: `class Solution {
    public int minCostClimbingStairs(int[] cost) {
        int prev = 0, curr = 0;
        for (int i = 2; i <= cost.length; i++) {
            int next = Math.min(curr + cost[i-1], prev + cost[i-2]);
            prev = curr;
            curr = next;
        }
        return curr;
    }
}`,
cppCode: `class Solution {
public:
    int minCostClimbingStairs(vector<int>& cost) {
        int prev = 0, cur = 0;
        for (int i = 2; i <= cost.size(); i++) {
            int nxt = min(cur + cost[i-1], prev + cost[i-2]);
            prev = cur;
            cur = nxt;
        }
        return cur;
    }
};`,
},
  763: {
pythonCode: `class Solution:
    def partitionLabels(self, s):
        last = {}
        for i, ch in enumerate(s):
            last[ch] = i
        result = []
        start = end = 0
        for i, ch in enumerate(s):
            end = max(end, last[ch])
            if i == end:
                result.append(end - start + 1)
                start = end + 1
        return result`,
typescriptCode: `class Solution {
  partitionLabels(s: string): number[] {
    const last: Record<string, number> = {};
    for (let i = 0; i < s.length; i++) last[s[i]] = i;
    const result: number[] = [];
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
javaCode: `class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];
        for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
        List<Integer> result = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']);
            if (i == end) { result.add(end - start + 1); start = end + 1; }
        }
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> partitionLabels(string s) {
        int last[26] = {};
        for (int i = 0; i < s.size(); i++) last[s[i]-'a'] = i;
        vector<int> result;
        int start = 0, end = 0;
        for (int i = 0; i < s.size(); i++) {
            end = max(end, last[s[i]-'a']);
            if (i == end) { result.push_back(end-start+1); start = end+1; }
        }
        return result;
    }
};`,
},
  846: {
pythonCode: `class Solution:
    def isNStraightHand(self, hand, groupSize):
        if len(hand) % groupSize != 0:
            return False
        from collections import Counter
        counts = Counter(hand)
        for card in sorted(counts):
            cnt = counts[card]
            if cnt == 0:
                continue
            for nxt in range(card, card + groupSize):
                if counts.get(nxt, 0) < cnt:
                    return False
                counts[nxt] -= cnt
        return True`,
typescriptCode: `class Solution {
  isNStraightHand(hand: number[], groupSize: number): boolean {
    if (hand.length % groupSize !== 0) return false;
    const counts = new Map<number, number>();
    for (const card of hand) counts.set(card, (counts.get(card) ?? 0) + 1);
    const unique = [...counts.keys()].sort((a, b) => a - b);
    for (const card of unique) {
      const count = counts.get(card)!;
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
javaCode: `class Solution {
    public boolean isNStraightHand(int[] hand, int groupSize) {
        if (hand.length % groupSize != 0) return false;
        Map<Integer, Integer> counts = new TreeMap<>();
        for (int card : hand) counts.merge(card, 1, Integer::sum);
        for (int card : counts.keySet()) {
            int cnt = counts.get(card);
            if (cnt == 0) continue;
            for (int nxt = card; nxt < card + groupSize; nxt++) {
                int avail = counts.getOrDefault(nxt, 0);
                if (avail < cnt) return false;
                counts.put(nxt, avail - cnt);
            }
        }
        return true;
    }
}`,
cppCode: `class Solution {
public:
    bool isNStraightHand(vector<int>& hand, int groupSize) {
        if (hand.size() % groupSize) return false;
        map<int,int> counts;
        for (int c : hand) counts[c]++;
        for (auto& [card, cnt] : counts) {
            if (cnt == 0) continue;
            for (int nxt = card; nxt < card + groupSize; nxt++) {
                if (counts[nxt] < cnt) return false;
                counts[nxt] -= cnt;
            }
        }
        return true;
    }
};`,
},
  853: {
pythonCode: `class Solution:
    def carFleet(self, target, position, speed):
        cars = [(pos, (target - pos) / spd) for pos, spd in zip(position, speed)]
        cars.sort(reverse=True)
        fleets = 0
        slowest = 0
        for _, time in cars:
            if time > slowest:
                fleets += 1
                slowest = time
        return fleets`,
typescriptCode: `class Solution {
  carFleet(target: number, position: number[], speed: number[]): number {
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
javaCode: `class Solution {
    public int carFleet(int target, int[] position, int[] speed) {
        int n = position.length;
        double[][] cars = new double[n][2];
        for (int i = 0; i < n; i++) {
            cars[i][0] = position[i];
            cars[i][1] = (double)(target - position[i]) / speed[i];
        }
        Arrays.sort(cars, (a, b) -> Double.compare(b[0], a[0]));
        int fleets = 0;
        double slowest = 0;
        for (double[] car : cars) {
            if (car[1] > slowest) { fleets++; slowest = car[1]; }
        }
        return fleets;
    }
}`,
cppCode: `class Solution {
public:
    int carFleet(int target, vector<int>& position, vector<int>& speed) {
        int n = position.size();
        vector<pair<double,double>> cars(n);
        for (int i = 0; i < n; i++)
            cars[i] = {(double)position[i], (double)(target-position[i])/speed[i]};
        sort(cars.begin(), cars.end(), [](auto& a, auto& b){ return a.first > b.first; });
        int fleets = 0;
        double slowest = 0;
        for (auto& [_, t] : cars)
            if (t > slowest) { fleets++; slowest = t; }
        return fleets;
    }
};`,
},
  875: {
pythonCode: `class Solution:
    def minEatingSpeed(self, piles, h):
        import math

        def can_eat(speed):
            return sum(math.ceil(p / speed) for p in piles) <= h

        left, right = 1, max(piles)
        while left < right:
            mid = (left + right) // 2
            if can_eat(mid):
                right = mid
            else:
                left = mid + 1
        return left`,
typescriptCode: `class Solution {
  minEatingSpeed(piles: number[], h: number): number {
    const canEat = (speed: number): boolean => {
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
javaCode: `class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int left = 1, right = 0;
        for (int p : piles) right = Math.max(right, p);
        while (left < right) {
            int mid = (left + right) / 2;
            long hours = 0;
            for (int p : piles) hours += (p + mid - 1) / mid;
            if (hours <= h) right = mid;
            else left = mid + 1;
        }
        return left;
    }
}`,
cppCode: `class Solution {
public:
    int minEatingSpeed(vector<int>& piles, int h) {
        int left = 1, right = *max_element(piles.begin(), piles.end());
        while (left < right) {
            int mid = (left + right) / 2;
            long hours = 0;
            for (int p : piles) hours += (p + mid - 1) / mid;
            if (hours <= h) right = mid;
            else left = mid + 1;
        }
        return left;
    }
};`,
},
  876: {
pythonCode: `class Solution:
    def middleNode(self, head):
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        return slow`,
typescriptCode: `class Solution {
  middleNode(head: ListNode | null): ListNode | null {
    let slow = head;
    let fast = head;
    while (fast !== null && fast.next !== null) {
      slow = slow!.next;
      fast = fast.next.next;
    }
    return slow;
  }
}`,
javaCode: `class Solution {
    public ListNode middleNode(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }
}`,
cppCode: `class Solution {
public:
    ListNode* middleNode(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) {
            slow = slow->next;
            fast = fast->next->next;
        }
        return slow;
    }
};`,
},
  881: {
pythonCode: `class Solution:
    def numRescueBoats(self, people, limit):
        people.sort()
        left, right = 0, len(people) - 1
        boats = 0
        while left <= right:
            if people[left] + people[right] <= limit:
                left += 1
            right -= 1
            boats += 1
        return boats`,
typescriptCode: `class Solution {
  numRescueBoats(people: number[], limit: number): number {
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
javaCode: `class Solution {
    public int numRescueBoats(int[] people, int limit) {
        Arrays.sort(people);
        int left = 0, right = people.length - 1, boats = 0;
        while (left <= right) {
            if (people[left] + people[right] <= limit) left++;
            right--;
            boats++;
        }
        return boats;
    }
}`,
cppCode: `class Solution {
public:
    int numRescueBoats(vector<int>& people, int limit) {
        sort(people.begin(), people.end());
        int left = 0, right = people.size() - 1, boats = 0;
        while (left <= right) {
            if (people[left] + people[right] <= limit) left++;
            right--;
            boats++;
        }
        return boats;
    }
};`,
},
  912: {
pythonCode: `class Solution:
    def sortArray(self, nums):
        return sorted(nums)`,
typescriptCode: `class Solution {
  sortArray(nums: number[]): number[] {
    return nums.slice().sort((a, b) => a - b);
  }
}`,
javaCode: `class Solution {
    public int[] sortArray(int[] nums) {
        Arrays.sort(nums);
        return nums;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> sortArray(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        return nums;
    }
};`,
},
  929: {
pythonCode: `class Solution:
    def numUniqueEmails(self, emails):
        seen = set()
        for email in emails:
            local, domain = email.split('@')
            cleaned = local.split('+')[0].replace('.', '')
            seen.add(cleaned + '@' + domain)
        return len(seen)`,
typescriptCode: `class Solution {
  numUniqueEmails(emails: string[]): number {
    const seen = new Set<string>();
    for (const email of emails) {
      const [local, domain] = email.split("@");
      const cleaned = local.split("+")[0].replace(/\\./g, "");
      seen.add(cleaned + "@" + domain);
    }
    return seen.size;
  }
}`,
javaCode: `class Solution {
    public int numUniqueEmails(String[] emails) {
        Set<String> seen = new HashSet<>();
        for (String email : emails) {
            String[] parts = email.split("@");
            String cleaned = parts[0].split("\\\\+")[0].replace(".", "");
            seen.add(cleaned + "@" + parts[1]);
        }
        return seen.size();
    }
}`,
cppCode: `class Solution {
public:
    int numUniqueEmails(vector<string>& emails) {
        unordered_set<string> seen;
        for (auto& email : emails) {
            auto at = email.find('@');
            string local = email.substr(0, at);
            string domain = email.substr(at + 1);
            auto plus = local.find('+');
            if (plus != string::npos) local = local.substr(0, plus);
            string::iterator end = remove(local.begin(), local.end(), '.');
            local.erase(end, local.end());
            seen.insert(local + "@" + domain);
        }
        return seen.size();
    }
};`,
},
  977: {
pythonCode: `class Solution:
    def sortedSquares(self, nums):
        result = [0] * len(nums)
        left, right = 0, len(nums) - 1
        for i in range(len(nums) - 1, -1, -1):
            if abs(nums[left]) > abs(nums[right]):
                result[i] = nums[left] * nums[left]
                left += 1
            else:
                result[i] = nums[right] * nums[right]
                right -= 1
        return result`,
typescriptCode: `class Solution {
  sortedSquares(nums: number[]): number[] {
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
javaCode: `class Solution {
    public int[] sortedSquares(int[] nums) {
        int[] result = new int[nums.length];
        int left = 0, right = nums.length - 1;
        for (int i = nums.length - 1; i >= 0; i--) {
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
cppCode: `class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {
        vector<int> result(nums.size());
        int left = 0, right = nums.size()-1;
        for (int i = nums.size()-1; i >= 0; i--) {
            if (abs(nums[left]) > abs(nums[right]))
                result[i] = nums[left]*nums[left++];
            else
                result[i] = nums[right]*nums[right--];
        }
        return result;
    }
};`,
},
  1029: {
pythonCode: `class Solution:
    def twoCitySchedCost(self, costs):
        sorted_costs = sorted(costs, key=lambda x: x[0] - x[1])
        total = 0
        half = len(sorted_costs) // 2
        for i, (a, b) in enumerate(sorted_costs):
            total += a if i < half else b
        return total`,
typescriptCode: `class Solution {
  twoCitySchedCost(costs: number[][]): number {
    const sorted = [...costs].sort((a, b) => a[0] - a[1] - (b[0] - b[1]));
    let total = 0;
    const half = sorted.length / 2;
    for (let i = 0; i < sorted.length; i++) {
      total += i < half ? sorted[i][0] : sorted[i][1];
    }
    return total;
  }
}`,
javaCode: `class Solution {
    public int twoCitySchedCost(int[][] costs) {
        Arrays.sort(costs, (a, b) -> a[0] - a[1] - (b[0] - b[1]));
        int total = 0, half = costs.length / 2;
        for (int i = 0; i < costs.length; i++) {
            total += i < half ? costs[i][0] : costs[i][1];
        }
        return total;
    }
}`,
cppCode: `class Solution {
public:
    int twoCitySchedCost(vector<vector<int>>& costs) {
        sort(costs.begin(), costs.end(), [](auto& a, auto& b) {
            return a[0]-a[1] < b[0]-b[1];
        });
        int total = 0, half = costs.size()/2;
        for (int i = 0; i < costs.size(); i++)
            total += i < half ? costs[i][0] : costs[i][1];
        return total;
    }
};`,
},
  1041: {
pythonCode: `class Solution:
    def isRobotBounded(self, instructions):
        x = y = 0
        direction = 0
        dx = [0, 1, 0, -1]
        dy = [1, 0, -1, 0]
        for instruction in instructions:
            if instruction == 'G':
                x += dx[direction]
                y += dy[direction]
            elif instruction == 'L':
                direction = (direction + 3) % 4
            else:
                direction = (direction + 1) % 4
        return (x == 0 and y == 0) or direction != 0`,
typescriptCode: `class Solution {
  isRobotBounded(instructions: string): boolean {
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
javaCode: `class Solution {
    public boolean isRobotBounded(String instructions) {
        int x = 0, y = 0, dir = 0;
        int[][] d = {{0,1},{1,0},{0,-1},{-1,0}};
        for (char ch : instructions.toCharArray()) {
            if (ch == 'G') { x += d[dir][0]; y += d[dir][1]; }
            else if (ch == 'L') dir = (dir + 3) % 4;
            else dir = (dir + 1) % 4;
        }
        return (x == 0 && y == 0) || dir != 0;
    }
}`,
cppCode: `class Solution {
public:
    bool isRobotBounded(string instructions) {
        int x = 0, y = 0, dir = 0;
        int dx[] = {0,1,0,-1}, dy[] = {1,0,-1,0};
        for (char ch : instructions) {
            if (ch == 'G') { x += dx[dir]; y += dy[dir]; }
            else if (ch == 'L') dir = (dir+3)%4;
            else dir = (dir+1)%4;
        }
        return (x==0 && y==0) || dir != 0;
    }
};`,
},
  1094: {
pythonCode: `class Solution:
    def carPooling(self, trips, capacity):
        timeline = [0] * 1001
        for passengers, fr, to in trips:
            timeline[fr] += passengers
            timeline[to] -= passengers
        current = 0
        for change in timeline:
            current += change
            if current > capacity:
                return False
        return True`,
typescriptCode: `class Solution {
  carPooling(trips: number[][], capacity: number): boolean {
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
javaCode: `class Solution {
    public boolean carPooling(int[][] trips, int capacity) {
        int[] timeline = new int[1001];
        for (int[] trip : trips) {
            timeline[trip[1]] += trip[0];
            timeline[trip[2]] -= trip[0];
        }
        int current = 0;
        for (int change : timeline) {
            current += change;
            if (current > capacity) return false;
        }
        return true;
    }
}`,
cppCode: `class Solution {
public:
    bool carPooling(vector<vector<int>>& trips, int capacity) {
        int timeline[1001] = {};
        for (auto& t : trips) { timeline[t[1]] += t[0]; timeline[t[2]] -= t[0]; }
        int cur = 0;
        for (int c : timeline) { cur += c; if (cur > capacity) return false; }
        return true;
    }
};`,
},
  1143: {
pythonCode: `class Solution:
    def longestCommonSubsequence(self, text1, text2):
        rows, cols = len(text1), len(text2)
        dp = [[0] * (cols + 1) for _ in range(rows + 1)]
        for i in range(1, rows + 1):
            for j in range(1, cols + 1):
                if text1[i - 1] == text2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
        return dp[rows][cols]`,
typescriptCode: `class Solution {
  longestCommonSubsequence(text1: string, text2: string): number {
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
javaCode: `class Solution {
    public int longestCommonSubsequence(String text1, String text2) {
        int rows = text1.length(), cols = text2.length();
        int[][] dp = new int[rows + 1][cols + 1];
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= cols; j++) {
                if (text1.charAt(i-1) == text2.charAt(j-1))
                    dp[i][j] = dp[i-1][j-1] + 1;
                else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
        return dp[rows][cols];
    }
}`,
cppCode: `class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int rows = text1.size(), cols = text2.size();
        vector<vector<int>> dp(rows+1, vector<int>(cols+1));
        for (int i = 1; i <= rows; i++)
            for (int j = 1; j <= cols; j++)
                dp[i][j] = text1[i-1]==text2[j-1] ? dp[i-1][j-1]+1 : max(dp[i-1][j],dp[i][j-1]);
        return dp[rows][cols];
    }
};`,
},
  1189: {
pythonCode: `class Solution:
    def maxNumberOfBalloons(self, text):
        counts = {}
        for ch in text:
            counts[ch] = counts.get(ch, 0) + 1
        return min(
            counts.get('b', 0),
            counts.get('a', 0),
            counts.get('l', 0) // 2,
            counts.get('o', 0) // 2,
            counts.get('n', 0)
        )`,
typescriptCode: `class Solution {
  maxNumberOfBalloons(text: string): number {
    const counts: Record<string, number> = {};
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
javaCode: `class Solution {
    public int maxNumberOfBalloons(String text) {
        int[] counts = new int[26];
        for (char ch : text.toCharArray()) counts[ch - 'a']++;
        return Math.min(counts['b'-'a'], Math.min(counts['a'-'a'],
            Math.min(counts['l'-'a']/2, Math.min(counts['o'-'a']/2, counts['n'-'a']))));
    }
}`,
cppCode: `class Solution {
public:
    int maxNumberOfBalloons(string text) {
        int counts[26] = {};
        for (char ch : text) counts[ch-'a']++;
        return min({counts['b'-'a'], counts['a'-'a'],
            counts['l'-'a']/2, counts['o'-'a']/2, counts['n'-'a']});
    }
};`,
},
  1209: {
pythonCode: `class Solution:
    def removeDuplicates(self, s, k):
        stack = []
        for ch in s:
            if stack and stack[-1][0] == ch:
                stack[-1] = (ch, stack[-1][1] + 1)
                if stack[-1][1] == k:
                    stack.pop()
            else:
                stack.append((ch, 1))
        return ''.join(ch * cnt for ch, cnt in stack)`,
typescriptCode: `class Solution {
  removeDuplicates(s: string, k: number): string {
    const stack: [string, number][] = [];
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
javaCode: `class Solution {
    public String removeDuplicates(String s, int k) {
        StringBuilder sb = new StringBuilder();
        int[] counts = new int[s.length()];
        for (char ch : s.toCharArray()) {
            sb.append(ch);
            int pos = sb.length() - 1;
            counts[pos] = (pos > 0 && sb.charAt(pos) == sb.charAt(pos-1)) ? counts[pos-1]+1 : 1;
            if (counts[pos] == k) sb.delete(sb.length() - k, sb.length());
        }
        return sb.toString();
    }
}`,
cppCode: `class Solution {
public:
    string removeDuplicates(string s, int k) {
        vector<int> counts;
        string result;
        for (char ch : s) {
            result += ch;
            counts.push_back((!result.empty() && result.size()>1 &&
                result[result.size()-1]==result[result.size()-2]) ? counts.back()+1 : 1);
            if (counts.back() == k) {
                result.resize(result.size()-k);
                counts.resize(counts.size()-k);
            }
        }
        return result;
    }
};`,
},
  1288: {
pythonCode: `class Solution:
    def removeCoveredIntervals(self, intervals):
        sorted_intervals = sorted(intervals, key=lambda x: (x[0], -x[1]))
        covered = 0
        max_end = float('-inf')
        for start, end in sorted_intervals:
            if end <= max_end:
                covered += 1
            else:
                max_end = end
        return len(intervals) - covered`,
typescriptCode: `class Solution {
  removeCoveredIntervals(intervals: number[][]): number {
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
javaCode: `class Solution {
    public int removeCoveredIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] == b[0] ? b[1] - a[1] : a[0] - b[0]);
        int covered = 0, maxEnd = -1;
        for (int[] inv : intervals) {
            if (inv[1] <= maxEnd) covered++;
            else maxEnd = inv[1];
        }
        return intervals.length - covered;
    }
}`,
cppCode: `class Solution {
public:
    int removeCoveredIntervals(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end(), [](auto& a, auto& b){
            return a[0]==b[0] ? a[1]>b[1] : a[0]<b[0];
        });
        int covered = 0, maxEnd = -1;
        for (auto& inv : intervals) {
            if (inv[1] <= maxEnd) covered++;
            else maxEnd = inv[1];
        }
        return intervals.size() - covered;
    }
};`,
},
  1299: {
pythonCode: `class Solution:
    def replaceElements(self, arr):
        result = [0] * len(arr)
        mx = -1
        for i in range(len(arr) - 1, -1, -1):
            result[i] = mx
            mx = max(mx, arr[i])
        return result`,
typescriptCode: `class Solution {
  replaceElements(arr: number[]): number[] {
    const result = new Array(arr.length);
    let max = -1;
    for (let i = arr.length - 1; i >= 0; i--) {
      result[i] = max;
      max = Math.max(max, arr[i]);
    }
    return result;
  }
}`,
javaCode: `class Solution {
    public int[] replaceElements(int[] arr) {
        int[] result = new int[arr.length];
        int max = -1;
        for (int i = arr.length - 1; i >= 0; i--) {
            result[i] = max;
            max = Math.max(max, arr[i]);
        }
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> replaceElements(vector<int>& arr) {
        vector<int> result(arr.size());
        int max = -1;
        for (int i = arr.size() - 1; i >= 0; i--) {
            result[i] = max;
            max = std::max(max, arr[i]);
        }
        return result;
    }
};`,
},
  1448: {
pythonCode: `class Solution:
    def goodNodes(self, root):
        def count(node, max_so_far):
            if not node:
                return 0
            good = 1 if node.val >= max_so_far else 0
            next_max = max(max_so_far, node.val)
            return good + count(node.left, next_max) + count(node.right, next_max)

        return count(root, float('-inf'))`,
typescriptCode: `class Solution {
  goodNodes(root: TreeNode | null): number {
    return this.count(root, -Infinity);
  }
  count(node: TreeNode | null, maxSoFar: number): number {
    if (node === null) return 0;
    const good = node.val >= maxSoFar ? 1 : 0;
    const nextMax = Math.max(maxSoFar, node.val);
    return good + this.count(node.left, nextMax) + this.count(node.right, nextMax);
  }
}`,
javaCode: `class Solution {
    public int goodNodes(TreeNode root) {
        return count(root, Integer.MIN_VALUE);
    }
    private int count(TreeNode node, int maxSoFar) {
        if (node == null) return 0;
        int good = node.val >= maxSoFar ? 1 : 0;
        int nextMax = Math.max(maxSoFar, node.val);
        return good + count(node.left, nextMax) + count(node.right, nextMax);
    }
}`,
cppCode: `class Solution {
public:
    int goodNodes(TreeNode* root) { return cnt(root, INT_MIN); }
    int cnt(TreeNode* node, int mx) {
        if (!node) return 0;
        int g = node->val >= mx ? 1 : 0;
        return g + cnt(node->left, max(mx, node->val)) + cnt(node->right, max(mx, node->val));
    }
};`,
},
  1929: {
pythonCode: `class Solution:
    def getConcatenation(self, nums):
        return nums + nums`,
typescriptCode: `class Solution {
  getConcatenation(nums: number[]): number[] {
    return nums.concat(nums);
  }
}`,
javaCode: `class Solution {
    public int[] getConcatenation(int[] nums) {
        int n = nums.length;
        int[] result = new int[2 * n];
        for (int i = 0; i < n; i++) {
            result[i] = nums[i];
            result[i + n] = nums[i];
        }
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> getConcatenation(vector<int>& nums) {
        int n = nums.size();
        vector<int> result(2 * n);
        for (int i = 0; i < n; i++) {
            result[i] = nums[i];
            result[i + n] = nums[i];
        }
        return result;
    }
};`,
},
  2028: {
pythonCode: `class Solution:
    def missingRolls(self, rolls, mean, n):
        total = mean * (len(rolls) + n)
        missing = total - sum(rolls)
        if missing < n or missing > 6 * n:
            return []
        base = missing // n
        remainder = missing % n
        result = [base] * n
        for i in range(remainder):
            result[i] += 1
        return result`,
typescriptCode: `class Solution {
  missingRolls(rolls: number[], mean: number, n: number): number[] {
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
javaCode: `class Solution {
    public int[] missingRolls(int[] rolls, int mean, int n) {
        int total = mean * (rolls.length + n);
        int missing = total;
        for (int roll : rolls) missing -= roll;
        if (missing < n || missing > 6 * n) return new int[]{};
        int base = missing / n, remainder = missing % n;
        int[] result = new int[n];
        for (int i = 0; i < n; i++) result[i] = base + (i < remainder ? 1 : 0);
        return result;
    }
}`,
cppCode: `class Solution {
public:
    vector<int> missingRolls(vector<int>& rolls, int mean, int n) {
        int total = mean * ((int)rolls.size() + n);
        for (int r : rolls) total -= r;
        if (total < n || total > 6*n) return {};
        int base = total/n, rem = total%n;
        vector<int> result(n, base);
        for (int i = 0; i < rem; i++) result[i]++;
        return result;
    }
};`,
},
  2130: {
pythonCode: `class Solution:
    def pairSum(self, head):
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
        prev = None
        while slow:
            nxt = slow.next
            slow.next = prev
            prev = slow
            slow = nxt
        best = 0
        left, right = head, prev
        while right:
            best = max(best, left.val + right.val)
            left = left.next
            right = right.next
        return best`,
typescriptCode: `class Solution {
  pairSum(head: ListNode | null): number {
    let slow: any = head;
    let fast: any = head;
    while (fast !== null && fast.next !== null) {
      slow = slow.next;
      fast = fast.next.next;
    }
    let prev: ListNode | null = null;
    let current: any = slow;
    while (current !== null) {
      const next = current.next;
      current.next = prev;
      prev = current;
      current = next;
    }
    let left: any = head;
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
javaCode: `class Solution {
    public int pairSum(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
        ListNode prev = null;
        while (slow != null) { ListNode next = slow.next; slow.next = prev; prev = slow; slow = next; }
        int best = 0;
        ListNode left = head, right = prev;
        while (right != null) { best = Math.max(best, left.val + right.val); left = left.next; right = right.next; }
        return best;
    }
}`,
cppCode: `class Solution {
public:
    int pairSum(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
        ListNode *prev = nullptr;
        while (slow) { ListNode* nxt = slow->next; slow->next = prev; prev = slow; slow = nxt; }
        int best = 0;
        ListNode *l = head, *r = prev;
        while (r) { best = max(best, l->val + r->val); l = l->next; r = r->next; }
        return best;
    }
};`,
},
};
