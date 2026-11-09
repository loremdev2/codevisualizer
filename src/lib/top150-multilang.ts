// ---------------------------------------------------------------------------
// Multi-language variants (Python, TypeScript, Java, C++) for the Top Interview 150 templates.
//
// AUTO-GENERATED from templates/top150-multilang.json — do not edit by hand.
// Each entry mirrors the JS solution in top150-templates.ts (same class
// Solution + method + parameter names, so the auto-detected harness maps
// the input identically). All solutions are verified in top150-templates.test.ts.
// ---------------------------------------------------------------------------

export type Top150MultiLang = {
  pythonCode?: string;
  typescriptCode?: string;
  javaCode?: string;
  cppCode?: string;
  brutePythonCode?: string;
  bruteTypeScriptCode?: string;
  bruteJavaCode?: string;
  bruteCppCode?: string;
};

export const top150MultiLang: Partial<Record<number, Top150MultiLang>> = {
  1: {
pythonCode: `class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i`,
typescriptCode: `class Solution {
  twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (seen.has(complement)) return [seen.get(complement) as number, i];
      seen.set(nums[i], i);
    }
    return [];
  }
}`,
javaCode: `
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) return new int[]{seen.get(complement), i};
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}
`,
cppCode: `
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int,int> seen;
        for(int i=0;i<nums.size();i++){int c=target-nums[i];if(seen.count(c))return{seen[c],i};seen[nums[i]]=i;}
        return {};
    }
};`,
brutePythonCode: `class Solution:
    def twoSum(self, nums, target):
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]`,
bruteTypeScriptCode: `class Solution {
  twoSum(nums: number[], target: number): number[] {
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] === target) return [i, j];
      }
    }
    return [];
  }
}`,
},
  2: {
pythonCode: `class Solution:
    def addTwoNumbers(self, l1, l2):
        dummy = ListNode(0)
        tail = dummy
        carry = 0
        while l1 is not None or l2 is not None or carry > 0:
            total = (l1.val if l1 else 0) + (l2.val if l2 else 0) + carry
            carry = total // 10
            tail.next = ListNode(total % 10)
            tail = tail.next
            if l1 is not None:
                l1 = l1.next
            if l2 is not None:
                l2 = l2.next
        return dummy.next`,
typescriptCode: `class Solution {
  addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
    const dummy = new ListNode(0);
    let tail = dummy;
    let carry = 0;
    while (l1 !== null || l2 !== null || carry > 0) {
      const total = (l1 ? l1.val : 0) + (l2 ? l2.val : 0) + carry;
      carry = Math.floor(total / 10);
      tail.next = new ListNode(total % 10);
      tail = tail.next;
      if (l1) l1 = l1.next;
      if (l2) l2 = l2.next;
    }
    return dummy.next;
  }
}`,
javaCode: `
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0), curr = dummy;
        int carry = 0;
        while (l1 != null || l2 != null || carry != 0) {
            int sum = carry;
            if (l1 != null) { sum += l1.val; l1 = l1.next; }
            if (l2 != null) { sum += l2.val; l2 = l2.next; }
            curr.next = new ListNode(sum % 10);
            curr = curr.next;
            carry = sum / 10;
        }
        return dummy.next;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode dummy(0); ListNode* curr = &dummy;
        int carry = 0;
        while (l1 || l2 || carry) {
            int sum = carry;
            if (l1) { sum += l1->val; l1 = l1->next; }
            if (l2) { sum += l2->val; l2 = l2->next; }
            curr->next = new ListNode(sum % 10);
            curr = curr->next;
            carry = sum / 10;
        }
        return dummy.next;
    }
};`,
},
  3: {
pythonCode: `class Solution:
    def lengthOfLongestSubstring(self, s):
        seen = set()
        left = 0
        best = 0
        for right in range(len(s)):
            while s[right] in seen:
                seen.remove(s[left])
                left += 1
            seen.add(s[right])
            best = max(best, right - left + 1)
        return best`,
typescriptCode: `class Solution {
  lengthOfLongestSubstring(s: string): number {
    const seen = new Set<string>();
    let left = 0;
    let best = 0;
    for (let right = 0; right < s.length; right++) {
      while (seen.has(s[right])) {
        seen.delete(s[left]);
        left++;
      }
      seen.add(s[right]);
      best = Math.max(best, right - left + 1);
    }
    return best;
  }
}`,
javaCode: `
class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int best = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            if (lastSeen.containsKey(ch)) left = Math.max(left, lastSeen.get(ch) + 1);
            best = Math.max(best, right - left + 1);
            lastSeen.put(ch, right);
        }
        return best;
    }
}
`,
cppCode: `
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char,int> last; int best=0, l=0;
        for(int r=0;r<s.size();r++){if(last.count(s[r]))l=max(l,last[s[r]]+1);best=max(best,r-l+1);last[s[r]]=r;}
        return best;
    }
};`,
brutePythonCode: `class Solution:
    def lengthOfLongestSubstring(self, s):
        best = 0
        for i in range(len(s)):
            seen = set()
            for j in range(i, len(s)):
                if s[j] in seen:
                    break
                seen.add(s[j])
                best = max(best, j - i + 1)
        return best`,
bruteTypeScriptCode: `class Solution {
  lengthOfLongestSubstring(s: string): number {
    let best = 0;
    for (let i = 0; i < s.length; i++) {
      const seen = new Set<string>();
      for (let j = i; j < s.length; j++) {
        if (seen.has(s[j])) break;
        seen.add(s[j]);
        best = Math.max(best, j - i + 1);
      }
    }
    return best;
  }
}`,
},
  4: {
pythonCode: `class Solution:
    def findMedianSortedArrays(self, nums1, nums2):
        if len(nums1) > len(nums2): nums1, nums2 = nums2, nums1
        m, n = len(nums1), len(nums2)
        lo, hi = 0, m
        while lo <= hi:
            i = (lo+hi)//2
            j = (m+n+1)//2 - i
            l1 = float('-inf') if i == 0 else nums1[i-1]
            r1 = float('inf') if i == m else nums1[i]
            l2 = float('-inf') if j == 0 else nums2[j-1]
            r2 = float('inf') if j == n else nums2[j]
            if l1 <= r2 and l2 <= r1:
                if (m+n) % 2 == 1: return max(l1, l2)
                return (max(l1,l2)+min(r1,r2))/2
            elif l1 > r2: hi = i-1
            else: lo = i+1`,
typescriptCode: `class Solution {
  findMedianSortedArrays(nums1: number[], nums2: number[]): number {
    if (nums1.length > nums2.length) [nums1, nums2] = [nums2, nums1];
    const m = nums1.length, n = nums2.length;
    let lo = 0, hi = m;
    while (lo <= hi) {
      const i = Math.floor((lo + hi) / 2);
      const j = Math.floor((m + n + 1) / 2) - i;
      const l1 = i === 0 ? -Infinity : nums1[i - 1];
      const r1 = i === m ? Infinity : nums1[i];
      const l2 = j === 0 ? -Infinity : nums2[j - 1];
      const r2 = j === n ? Infinity : nums2[j];
      if (l1 <= r2 && l2 <= r1) {
        if ((m + n) % 2 === 1) return Math.max(l1, l2);
        return (Math.max(l1, l2) + Math.min(r1, r2)) / 2;
      }
      if (l1 > r2) hi = i - 1; else lo = i + 1;
    }
    return 0;
  }
}`,
javaCode: `
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
        int m = nums1.length, n = nums2.length;
        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo + hi) / 2, j = (m + n + 1) / 2 - i;
            int maxLeft1 = (i == 0) ? Integer.MIN_VALUE : nums1[i - 1];
            int minRight1 = (i == m) ? Integer.MAX_VALUE : nums1[i];
            int maxLeft2 = (j == 0) ? Integer.MIN_VALUE : nums2[j - 1];
            int minRight2 = (j == n) ? Integer.MAX_VALUE : nums2[j];
            if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
                if ((m + n) % 2 == 1) return Math.max(maxLeft1, maxLeft2);
                return (Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2.0;
            } else if (maxLeft1 > minRight2) hi = i - 1;
            else lo = i + 1;
        }
        return 0;
    }
}
`,
cppCode: `class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size() > nums2.size()) return findMedianSortedArrays(nums2, nums1);
        int m = nums1.size(), n = nums2.size(), lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo+hi)/2, j = (m+n+1)/2 - i;
            int ml = (i==0) ? INT_MIN : nums1[i-1];
            int mr = (i==m) ? INT_MAX : nums1[i];
            int ml2 = (j==0) ? INT_MIN : nums2[j-1];
            int mr2 = (j==n) ? INT_MAX : nums2[j];
            if (ml <= mr2 && ml2 <= mr) {
                if ((m+n)%2) return max(ml, ml2);
                return (max(ml,ml2) + min(mr,mr2)) / 2.0;
            } else if (ml > mr2) hi = i-1; else lo = i+1;
        }
        return 0;
    }
};`,
},
  5: {
pythonCode: `class Solution:
    def longestPalindrome(self, s):
        best = ""
        for center in range(len(s)):
            left = center
            right = center
            while left >= 0 and right < len(s) and s[left] == s[right]:
                if right - left + 1 > len(best):
                    best = s[left:right + 1]
                left -= 1
                right += 1
            left = center
            right = center + 1
            while left >= 0 and right < len(s) and s[left] == s[right]:
                if right - left + 1 > len(best):
                    best = s[left:right + 1]
                left -= 1
                right += 1
        return best`,
typescriptCode: `class Solution {
  longestPalindrome(s: string): string {
    let best = "";
    for (let center = 0; center < s.length; center++) {
      let left = center;
      let right = center;
      while (left >= 0 && right < s.length && s[left] === s[right]) {
        if (right - left + 1 > best.length) best = s.slice(left, right + 1);
        left--;
        right++;
      }
      left = center;
      right = center + 1;
      while (left >= 0 && right < s.length && s[left] === s[right]) {
        if (right - left + 1 > best.length) best = s.slice(left, right + 1);
        left--;
        right++;
      }
    }
    return best;
  }
}`,
javaCode: `
class Solution {
    public String longestPalindrome(String s) {
        int start = 0, maxLen = 1;
        for (int i = 0; i < s.length(); i++) {
            int len1 = expand(s, i, i);
            int len2 = expand(s, i, i + 1);
            int len = Math.max(len1, len2);
            if (len > maxLen) { maxLen = len; start = i - (len - 1) / 2; }
        }
        return s.substring(start, start + maxLen);
    }
    private int expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
        return r - l - 1;
    }
}
`,
cppCode: `class Solution {
public:
    string longestPalindrome(string s) {
        int start = 0, maxLen = 1;
        for (int i = 0; i < s.size(); i++) {
            int l1 = expand(s,i,i), l2 = expand(s,i,i+1);
            int len = max(l1, l2);
            if (len > maxLen) { maxLen = len; start = i - (len-1)/2; }
        }
        return s.substr(start, maxLen);
    }
    int expand(string& s, int l, int r) {
        while (l >= 0 && r < s.size() && s[l] == s[r]) { l--; r++; }
        return r - l - 1;
    }
};`,
brutePythonCode: `class Solution:
    def longestPalindrome(self, s):
        best = ""
        for i in range(len(s)):
            for j in range(i, len(s)):
                sub = s[i:j + 1]
                if len(sub) > len(best) and sub == sub[::-1]:
                    best = sub
        return best`,
bruteTypeScriptCode: `class Solution {
  longestPalindrome(s: string): string {
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
},
  6: {
pythonCode: `class Solution:
    def convert(self, s, numRows):
        if numRows == 1 or numRows >= len(s): return s
        rows = [''] * numRows
        cur, direction = 0, 1
        for ch in s:
            rows[cur] += ch
            if cur == 0: direction = 1
            elif cur == numRows - 1: direction = -1
            cur += direction
        return ''.join(rows)`,
typescriptCode: `class Solution {
  convert(s: string, numRows: number): string {
    if (numRows === 1 || numRows >= s.length) return s;
    const rows: string[] = new Array(numRows).fill('');
    let cur = 0, dir = 1;
    for (const ch of s) {
      rows[cur] += ch;
      if (cur === 0) dir = 1; else if (cur === numRows - 1) dir = -1;
      cur += dir;
    }
    return rows.join('');
  }
}`,
javaCode: `
class Solution {
    public String convert(String s, int numRows) {
        if (numRows == 1 || numRows >= s.length()) return s;
        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) rows[i] = new StringBuilder();
        int cur = 0, dir = 1;
        for (char ch : s.toCharArray()) {
            rows[cur].append(ch);
            if (cur == 0) dir = 1;
            else if (cur == numRows - 1) dir = -1;
            cur += dir;
        }
        StringBuilder result = new StringBuilder();
        for (StringBuilder row : rows) result.append(row);
        return result.toString();
    }
}
`,
cppCode: `
class Solution {
public:
    string convert(string s, int numRows) {
        if(numRows==1||numRows>=s.size()) return s;
        vector<string> rows(numRows); int cur=0,dir=1;
        for(char ch:s){rows[cur]+=ch;if(cur==0)dir=1;else if(cur==numRows-1)dir=-1;cur+=dir;}
        string r; for(auto& row:rows)r+=row; return r;
    }
};`,
},
  9: {
pythonCode: `class Solution:
    def isPalindrome(self, x):
        if x < 0:
            return False
        original = x
        reversed_value = 0
        while x > 0:
            reversed_value = reversed_value * 10 + x % 10
            x //= 10
        return reversed_value == original`,
typescriptCode: `class Solution {
  isPalindrome(x: number): boolean {
    if (x < 0) return false;
    let original = x;
    let reversedValue = 0;
    while (x > 0) {
      reversedValue = reversedValue * 10 + (x % 10);
      x = Math.floor(x / 10);
    }
    return reversedValue === original;
  }
}`,
javaCode: `
class Solution {
    public boolean isPalindrome(int x) {
        if (x < 0) return false;
        long reversed = 0, original = x;
        while (x > 0) { reversed = reversed * 10 + x % 10; x /= 10; }
        return original == reversed;
    }
}
`,
cppCode: `class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0) return false;
        long rev = 0, orig = x;
        while (x) { rev = rev * 10 + x % 10; x /= 10; }
        return orig == rev;
    }
};`,
brutePythonCode: `class Solution:
    def isPalindrome(self, x):
        return str(x) == str(x)[::-1]`,
bruteTypeScriptCode: `class Solution {
  isPalindrome(x: number): boolean {
    const s = String(x);
    return s === s.split("").reverse().join("");
  }
}`,
},
  11: {
pythonCode: `class Solution:
    def maxArea(self, height):
        left, right, best = 0, len(height) - 1, 0
        while left < right:
            best = max(best, min(height[left], height[right]) * (right - left))
            if height[left] < height[right]: left += 1
            else: right -= 1
        return best`,
typescriptCode: `class Solution {
  maxArea(height: number[]): number {
    let l = 0, r = height.length - 1, best = 0;
    while (l < r) {
      best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
      if (height[l] < height[r]) l++; else r--;
    }
    return best;
  }
}`,
javaCode: `
class Solution {
    public int maxArea(int[] height) {
        int left = 0, right = height.length - 1, best = 0;
        while (left < right) {
            best = Math.max(best, Math.min(height[left], height[right]) * (right - left));
            if (height[left] < height[right]) left++;
            else right--;
        }
        return best;
    }
}
`,
cppCode: `
class Solution {
public:
    int maxArea(vector<int>& height) {
        int l=0,r=height.size()-1,best=0;
        while(l<r){best=max(best,min(height[l],height[r])*(r-l));if(height[l]<height[r])l++;else r--;}
        return best;
    }
};`,
},
  12: {
pythonCode: `class Solution:
    def intToRoman(self, num):
        vals = [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),(100,'C'),
                (90,'XC'),(50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]
        result = ''
        for val, sym in vals:
            while num >= val:
                result += sym
                num -= val
        return result`,
typescriptCode: `class Solution {
  intToRoman(num: number): string {
    const vals = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],
      [90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']] as [number,string][];
    let result = '';
    for (const [v, s] of vals) while (num >= v) { result += s; num -= v; }
    return result;
  }
}`,
javaCode: `
class Solution {
    public String intToRoman(int num) {
        int[] vals = {1000,900,500,400,100,90,50,40,10,9,5,4,1};
        String[] syms = {"M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"};
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < vals.length; i++) {
            while (num >= vals[i]) { sb.append(syms[i]); num -= vals[i]; }
        }
        return sb.toString();
    }
}
`,
cppCode: `
class Solution {
public:
    string intToRoman(int num) {
        int vals[]={1000,900,500,400,100,90,50,40,10,9,5,4,1};
        string syms[]={"M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"};
        string result;
        for (int i=0;i<13;i++) while(num>=vals[i]){result+=syms[i];num-=vals[i];}
        return result;
    }
};`,
},
  13: {
pythonCode: `class Solution:
    def romanToInt(self, s):
        values = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
        total = 0
        for i in range(len(s)):
            if i + 1 < len(s) and values[s[i]] < values[s[i + 1]]:
                total -= values[s[i]]
            else:
                total += values[s[i]]
        return total`,
typescriptCode: `class Solution {
  romanToInt(s: string): number {
    const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    for (let i = 0; i < s.length; i++) {
      if (i + 1 < s.length && values[s[i]] < values[s[i + 1]]) total -= values[s[i]];
      else total += values[s[i]];
    }
    return total;
  }
}`,
javaCode: `
class Solution {
    public int romanToInt(String s) {
        int total = 0;
        for (int i = 0; i < s.length(); i++) {
            int curr = value(s.charAt(i));
            int next = (i + 1 < s.length()) ? value(s.charAt(i + 1)) : 0;
            total += (curr < next) ? -curr : curr;
        }
        return total;
    }
    private int value(char c) {
        switch (c) {
            case 'I': return 1; case 'V': return 5; case 'X': return 10;
            case 'L': return 50; case 'C': return 100; case 'D': return 500;
            case 'M': return 1000; default: return 0;
        }
    }
}
`,
cppCode: `
class Solution {
public:
    int romanToInt(string s) {
        unordered_map<char,int> v = {{'I',1},{'V',5},{'X',10},{'L',50},{'C',100},{'D',500},{'M',1000}};
        int total = 0;
        for (int i = 0; i < s.size(); i++) {
            if (i+1 < s.size() && v[s[i]] < v[s[i+1]]) total -= v[s[i]];
            else total += v[s[i]];
        }
        return total;
    }
};`,
brutePythonCode: `class Solution:
    def romanToInt(self, s):
        values = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
        specials = {"IV": 4, "IX": 9, "XL": 40, "XC": 90, "CD": 400, "CM": 900}
        total = 0
        i = 0
        while i < len(s):
            pair = s[i:i + 2]
            if pair in specials:
                total += specials[pair]
                i += 2
            else:
                total += values[s[i]]
                i += 1
        return total`,
bruteTypeScriptCode: `class Solution {
  romanToInt(s: string): number {
    const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    const sub: Record<string, number> = { IV: 4, IX: 9, XL: 40, XC: 90, CD: 400, CM: 900 };
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
},
  14: {
pythonCode: `class Solution:
    def longestCommonPrefix(self, strs):
        if not strs: return ''
        prefix = strs[0]
        for s in strs[1:]:
            while not s.startswith(prefix):
                prefix = prefix[:-1]
                if not prefix: return ''
        return prefix`,
typescriptCode: `class Solution {
  longestCommonPrefix(strs: string[]): string {
    let prefix = strs[0];
    for (let i = 1; i < strs.length; i++)
      while (strs[i].indexOf(prefix) !== 0) { prefix = prefix.slice(0, -1); if (!prefix) return ''; }
    return prefix;
  }
}`,
javaCode: `
class Solution {
    public String longestCommonPrefix(String[] strs) {
        if (strs.length == 0) return "";
        String prefix = strs[0];
        for (int i = 1; i < strs.length; i++) {
            while (strs[i].indexOf(prefix) != 0) {
                prefix = prefix.substring(0, prefix.length() - 1);
                if (prefix.isEmpty()) return "";
            }
        }
        return prefix;
    }
}
`,
cppCode: `
class Solution {
public:
    string longestCommonPrefix(vector<string>& strs) {
        if(strs.empty()) return "";
        string prefix = strs[0];
        for(int i=1;i<strs.size();i++){
            while(strs[i].find(prefix)!=0){prefix.pop_back();if(prefix.empty())return "";}
        }
        return prefix;
    }
};`,
},
  15: {
pythonCode: `class Solution:
    def threeSum(self, nums):
        nums.sort()
        result = []
        for i in range(len(nums) - 2):
            if i > 0 and nums[i] == nums[i - 1]:
                continue
            left = i + 1
            right = len(nums) - 1
            while left < right:
                total = nums[i] + nums[left] + nums[right]
                if total == 0:
                    result.append([nums[i], nums[left], nums[right]])
                    left += 1
                    right -= 1
                    while left < right and nums[left] == nums[left - 1]:
                        left += 1
                    while left < right and nums[right] == nums[right + 1]:
                        right -= 1
                elif total < 0:
                    left += 1
                else:
                    right -= 1
        return result`,
typescriptCode: `class Solution {
  threeSum(nums: number[]): number[][] {
    nums.sort((a, b) => a - b);
    const result: number[][] = [];
    for (let i = 0; i < nums.length - 2; i++) {
      if (i > 0 && nums[i] === nums[i - 1]) continue;
      let left = i + 1;
      let right = nums.length - 1;
      while (left < right) {
        const total = nums[i] + nums[left] + nums[right];
        if (total === 0) {
          result.push([nums[i], nums[left], nums[right]]);
          left++;
          right--;
          while (left < right && nums[left] === nums[left - 1]) left++;
          while (left < right && nums[right] === nums[right + 1]) right--;
        } else if (total < 0) {
          left++;
        } else {
          right--;
        }
      }
    }
    return result;
  }
}`,
javaCode: `
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int sum = nums[i] + nums[left] + nums[right];
                if (sum == 0) {
                    result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++; right--;
                } else if (sum < 0) left++;
                else right--;
            }
        }
        return result;
    }
}
`,
cppCode: `
class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(),nums.end()); vector<vector<int>> result;
        for(int i=0;i<(int)nums.size()-2;i++){
            if(i>0&&nums[i]==nums[i-1]) continue;
            int l=i+1,r=nums.size()-1;
            while(l<r){int s=nums[i]+nums[l]+nums[r];
                if(s==0){result.push_back({nums[i],nums[l],nums[r]});
                    while(l<r&&nums[l]==nums[l+1])l++;while(l<r&&nums[r]==nums[r-1])r--;l++;r--;}
                else if(s<0)l++;else r--;
            }
        }
        return result;
    }
};`,
brutePythonCode: `class Solution:
    def threeSum(self, nums):
        nums.sort()
        result = []
        seen = set()
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                for k in range(j + 1, len(nums)):
                    if nums[i] + nums[j] + nums[k] == 0:
                        key = (nums[i], nums[j], nums[k])
                        if key not in seen:
                            seen.add(key)
                            result.append([nums[i], nums[j], nums[k]])
        return result`,
bruteTypeScriptCode: `class Solution {
  threeSum(nums: number[]): number[][] {
    nums.sort((a, b) => a - b);
    const result: number[][] = [];
    const seen = new Set<string>();
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
},
  17: {
pythonCode: `class Solution:
    def letterCombinations(self, digits):
        if not digits: return []
        m = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'}
        result = []
        def bt(i, cur):
            if i == len(digits): result.append(cur); return
            for c in m[digits[i]]: bt(i+1, cur+c)
        bt(0, '')
        return result`,
typescriptCode: `class Solution {
  letterCombinations(digits: string): string[] {
    if (!digits) return [];
    const m: Record<string,string> = {'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'};
    const result: string[] = [];
    const bt = (i: number, cur: string): void => {
      if (i === digits.length) { result.push(cur); return; }
      for (const c of m[digits[i]]) bt(i + 1, cur + c);
    };
    bt(0, '');
    return result;
  }
}`,
javaCode: `
class Solution {
    public List<String> letterCombinations(String digits) {
        if (digits.isEmpty()) return new ArrayList<>();
        String[] mapping = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        List<String> result = new ArrayList<>();
        backtrack(result, mapping, digits, "", 0);
        return result;
    }
    private void backtrack(List<String> result, String[] mapping, String digits, String current, int index) {
        if (index == digits.length()) { result.add(current); return; }
        for (char ch : mapping[digits.charAt(index) - '0'].toCharArray()) {
            backtrack(result, mapping, digits, current + ch, index + 1);
        }
    }
}
`,
cppCode: `class Solution {
public:
    vector<string> letterCombinations(string digits) {
        if (digits.empty()) return {};
        vector<string> mapping = {"","","abc","def","ghi","jkl","mno","pqrs","tuv","wxyz"};
        vector<string> result;
        function<void(int,string)> bt = [&](int i, string cur) {
            if (i == digits.size()) { result.push_back(cur); return; }
            for (char c : mapping[digits[i]-'0']) bt(i+1, cur+c);
        };
        bt(0, ""); return result;
    }
};`,
},
  19: {
pythonCode: `class Solution:
    def removeNthFromEnd(self, head, n):
        dummy = ListNode(0, head)
        fast = slow = dummy
        for _ in range(n + 1): fast = fast.next
        while fast:
            fast = fast.next
            slow = slow.next
        slow.next = slow.next.next
        return dummy.next`,
typescriptCode: `class Solution {
  removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
    const dummy = new ListNode(0, head);
    let fast: any = dummy, slow: any = dummy;
    for (let i = 0; i <= n; i++) fast = fast.next;
    while (fast) { fast = fast.next; slow = slow.next; }
    slow.next = slow.next.next;
    return dummy.next;
  }
}`,
javaCode: `
class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0, head);
        ListNode fast = dummy, slow = dummy;
        for (int i = 0; i <= n; i++) fast = fast.next;
        while (fast != null) { fast = fast.next; slow = slow.next; }
        slow.next = slow.next.next;
        return dummy.next;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        ListNode dummy(0); dummy.next = head;
        ListNode *fast = &dummy, *slow = &dummy;
        for (int i = 0; i <= n; i++) fast = fast->next;
        while (fast) { fast = fast->next; slow = slow->next; }
        slow->next = slow->next->next;
        return dummy.next;
    }
};`,
},
  20: {
pythonCode: `class Solution:
    def isValid(self, s):
        stack = []
        pairs = {")": "(", "]": "[", "}": "{"}
        for ch in s:
            if ch in pairs:
                if not stack or stack.pop() != pairs[ch]:
                    return False
            else:
                stack.append(ch)
        return len(stack) == 0`,
typescriptCode: `class Solution {
  isValid(s: string): boolean {
    const stack: string[] = [];
    const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
    for (const ch of s) {
      if (pairs[ch]) {
        if (stack.pop() !== pairs[ch]) return false;
      } else {
        stack.push(ch);
      }
    }
    return stack.length === 0;
  }
}`,
javaCode: `
class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : s.toCharArray()) {
            if (ch == '(') stack.push(')');
            else if (ch == '{') stack.push('}');
            else if (ch == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != ch) return false;
        }
        return stack.isEmpty();
    }
}
`,
cppCode: `
class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for(char c:s){if(c=='(')st.push(')');else if(c=='{')st.push('}');else if(c=='[')st.push(']');else if(st.empty()||st.top()!=c)return false;else st.pop();}
        return st.empty();
    }
};`,
brutePythonCode: `class Solution:
    def isValid(self, s):
        previous = ""
        current = s
        while current != previous:
            previous = current
            current = current.replace("()", "").replace("[]", "").replace("{}", "")
        return current == ""`,
bruteTypeScriptCode: `class Solution {
  isValid(s: string): boolean {
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
},
  21: {
pythonCode: `class Solution:
    def mergeTwoLists(self, l1, l2):
        dummy = ListNode(0)
        tail = dummy
        while l1 is not None and l2 is not None:
            if l1.val <= l2.val:
                tail.next = l1
                l1 = l1.next
            else:
                tail.next = l2
                l2 = l2.next
            tail = tail.next
        tail.next = l1 if l1 is not None else l2
        return dummy.next`,
typescriptCode: `class Solution {
  mergeTwoLists(l1: ListNode | null, l2: ListNode | null): ListNode | null {
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
javaCode: `
class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(0), curr = dummy;
        while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) { curr.next = list1; list1 = list1.next; }
            else { curr.next = list2; list2 = list2.next; }
            curr = curr.next;
        }
        curr.next = (list1 != null) ? list1 : list2;
        return dummy.next;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {
        ListNode dummy(0); ListNode* curr = &dummy;
        while (l1 && l2) {
            if (l1->val <= l2->val) { curr->next = l1; l1 = l1->next; }
            else { curr->next = l2; l2 = l2->next; }
            curr = curr->next;
        }
        curr->next = l1 ? l1 : l2;
        return dummy.next;
    }
};`,
brutePythonCode: `class Solution:
    def mergeTwoLists(self, l1, l2):
        values = []
        node = l1
        while node is not None:
            values.append(node.val)
            node = node.next
        node = l2
        while node is not None:
            values.append(node.val)
            node = node.next
        values.sort()
        dummy = ListNode(0)
        tail = dummy
        for value in values:
            tail.next = ListNode(value)
            tail = tail.next
        return dummy.next`,
bruteTypeScriptCode: `class Solution {
  mergeTwoLists(l1: ListNode | null, l2: ListNode | null): ListNode | null {
    const values: number[] = [];
    const collect = (node: ListNode | null) => {
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
},
  22: {
pythonCode: `class Solution:
    def generateParenthesis(self, n):
        result = []
        def bt(cur, o, c):
            if len(cur) == 2*n: result.append(cur); return
            if o < n: bt(cur+'(', o+1, c)
            if c < o: bt(cur+')', o, c+1)
        bt('', 0, 0)
        return result`,
typescriptCode: `class Solution {
  generateParenthesis(n: number): string[] {
    const result: string[] = [];
    const bt = (cur: string, o: number, c: number): void => {
      if (cur.length === 2 * n) { result.push(cur); return; }
      if (o < n) bt(cur + '(', o + 1, c);
      if (c < o) bt(cur + ')', o, c + 1);
    };
    bt('', 0, 0);
    return result;
  }
}`,
javaCode: `
class Solution {
    public List<String> generateParenthesis(int n) {
        List<String> result = new ArrayList<>();
        backtrack(result, "", 0, 0, n);
        return result;
    }
    private void backtrack(List<String> result, String current, int open, int close, int max) {
        if (current.length() == max * 2) { result.add(current); return; }
        if (open < max) backtrack(result, current + "(", open + 1, close, max);
        if (close < open) backtrack(result, current + ")", open, close + 1, max);
    }
}
`,
cppCode: `class Solution {
public:
    vector<string> generateParenthesis(int n) {
        vector<string> r;
        function<void(string,int,int)> bt = [&](string cur, int open, int close) {
            if (cur.size() == 2*n) { r.push_back(cur); return; }
            if (open < n) bt(cur+"(", open+1, close);
            if (close < open) bt(cur+")", open, close+1);
        };
        bt("", 0, 0); return r;
    }
};`,
},
  23: {
javaCode: `
class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
        for (ListNode node : lists) if (node != null) pq.add(node);
        ListNode dummy = new ListNode(0), curr = dummy;
        while (!pq.isEmpty()) {
            ListNode node = pq.poll();
            curr.next = node;
            curr = curr.next;
            if (node.next != null) pq.add(node.next);
        }
        return dummy.next;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
        priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);
        for (auto l : lists) if (l) pq.push(l);
        ListNode dummy(0); ListNode* curr = &dummy;
        while (!pq.empty()) { ListNode* n = pq.top(); pq.pop();
            curr->next = n; curr = curr->next;
            if (n->next) pq.push(n->next); }
        return dummy.next;
    }
};`,
},
  25: {
pythonCode: `class Solution:
    def reverseKGroup(self, head, k):
        dummy = ListNode(0, head)
        groupPrev = dummy
        while True:
            kth = groupPrev
            for _ in range(k):
                kth = kth.next
                if not kth: return dummy.next
            groupNext = kth.next
            prev, curr = groupNext, groupPrev.next
            for _ in range(k):
                nxt = curr.next
                curr.next = prev
                prev = curr
                curr = nxt
            tmp = groupPrev.next
            groupPrev.next = kth
            groupPrev = tmp`,
typescriptCode: `class Solution {
  reverseKGroup(head: ListNode | null, k: number): ListNode | null {
    const dummy = new ListNode(0, head);
    let groupPrev: ListNode = dummy;
    while (true) {
      let kth: ListNode | null = groupPrev;
      for (let i = 0; i < k; i++) { kth = kth!.next; if (!kth) return dummy.next; }
      const groupNext = kth!.next;
      let prev: ListNode | null = groupNext, curr: ListNode | null = groupPrev.next;
      for (let i = 0; i < k; i++) {
        const nxt = curr!.next; curr!.next = prev; prev = curr; curr = nxt;
      }
      const tmp = groupPrev.next;
      groupPrev.next = kth;
      groupPrev = tmp!;
    }
  }
}`,
javaCode: `
class Solution {
    public ListNode reverseKGroup(ListNode head, int k) {
        ListNode dummy = new ListNode(0, head);
        ListNode prevGroup = dummy;
        while (true) {
            ListNode kth = getKth(prevGroup, k);
            if (kth == null) break;
            ListNode groupNext = kth.next;
            ListNode prev = groupNext, curr = prevGroup.next;
            while (curr != groupNext) {
                ListNode next = curr.next;
                curr.next = prev;
                prev = curr;
                curr = next;
            }
            ListNode tmp = prevGroup.next;
            prevGroup.next = kth;
            prevGroup = tmp;
        }
        return dummy.next;
    }
    private ListNode getKth(ListNode node, int k) {
        while (node != null && k > 0) { node = node.next; k--; }
        return node;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* reverseKGroup(ListNode* head, int k) {
        ListNode dummy(0); dummy.next = head;
        ListNode* prevGroup = &dummy;
        while (true) {
            ListNode* kth = prevGroup;
            for (int i = 0; i < k; i++) { kth = kth->next; if (!kth) return dummy.next; }
            ListNode* groupNext = kth->next;
            ListNode* prev = groupNext, *curr = prevGroup->next;
            while (curr != groupNext) { ListNode* nxt = curr->next; curr->next = prev; prev = curr; curr = nxt; }
            ListNode* tmp = prevGroup->next; prevGroup->next = kth; prevGroup = tmp;
        }
    }
};`,
},
  26: {
pythonCode: `class Solution:
    def removeDuplicates(self, nums):
        if not nums: return 0
        k = 1
        for i in range(1, len(nums)):
            if nums[i] != nums[k - 1]:
                nums[k] = nums[i]
                k += 1
        return k`,
typescriptCode: `class Solution {
  removeDuplicates(nums: number[]): number {
    if (nums.length === 0) return 0;
    let k = 1;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] !== nums[k - 1]) nums[k++] = nums[i];
    }
    return k;
  }
}`,
javaCode: `
class Solution {
    public int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        int k = 1;
        for (int i = 1; i < nums.length; i++) {
            if (nums[i] != nums[k - 1]) nums[k++] = nums[i];
        }
        return k;
    }
}
`,
cppCode: `
class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        if (nums.empty()) return 0;
        int k = 1;
        for (int i = 1; i < nums.size(); i++) {
            if (nums[i] != nums[k - 1]) nums[k++] = nums[i];
        }
        return k;
    }
};`,
},
  27: {
pythonCode: `class Solution:
    def removeElement(self, nums, val):
        k = 0
        for i in range(len(nums)):
            if nums[i] != val:
                nums[k] = nums[i]
                k += 1
        return k`,
typescriptCode: `class Solution {
  removeElement(nums: number[], val: number): number {
    let k = 0;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] !== val) nums[k++] = nums[i];
    }
    return k;
  }
}`,
javaCode: `
class Solution {
    public int removeElement(int[] nums, int val) {
        int k = 0;
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] != val) nums[k++] = nums[i];
        }
        return k;
    }
}
`,
cppCode: `
class Solution {
public:
    int removeElement(vector<int>& nums, int val) {
        int k = 0;
        for (int i = 0; i < nums.size(); i++) {
            if (nums[i] != val) nums[k++] = nums[i];
        }
        return k;
    }
};`,
},
  28: {
pythonCode: `class Solution:
    def strStr(self, haystack, needle):
        return haystack.find(needle)`,
typescriptCode: `class Solution {
  strStr(haystack: string, needle: string): number {
    return haystack.indexOf(needle);
  }
}`,
javaCode: `
class Solution {
    public int strStr(String haystack, String needle) {
        return haystack.indexOf(needle);
    }
}
`,
cppCode: `
class Solution {
public:
    int strStr(string haystack, string needle) {
        auto pos = haystack.find(needle);
        return pos == string::npos ? -1 : (int)pos;
    }
};`,
},
  33: {
pythonCode: `class Solution:
    def search(self, nums, target):
        left = 0
        right = len(nums) - 1
        while left <= right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            if nums[left] <= nums[mid]:
                if nums[left] <= target < nums[mid]:
                    right = mid - 1
                else:
                    left = mid + 1
            else:
                if nums[mid] < target <= nums[right]:
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
      if (nums[left] <= nums[mid]) {
        if (nums[left] <= target && target < nums[mid]) right = mid - 1;
        else left = mid + 1;
      } else {
        if (nums[mid] < target && target <= nums[right]) left = mid + 1;
        else right = mid - 1;
      }
    }
    return -1;
  }
}`,
javaCode: `
class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {
                if (target >= nums[lo] && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (target > nums[mid] && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }
}
`,
cppCode: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size()-1;
        while (lo <= hi) { int m = (lo+hi)/2;
            if (nums[m] == target) return m;
            if (nums[lo] <= nums[m]) {
                if (target >= nums[lo] && target < nums[m]) hi = m-1; else lo = m+1;
            } else {
                if (target > nums[m] && target <= nums[hi]) lo = m+1; else hi = m-1;
            }
        }
        return -1;
    }
};`,
brutePythonCode: `class Solution:
    def search(self, nums, target):
        if target in nums:
            return nums.index(target)
        return -1`,
bruteTypeScriptCode: `class Solution {
  search(nums: number[], target: number): number {
    return nums.indexOf(target);
  }
}`,
},
  34: {
pythonCode: `class Solution:
    def searchRange(self, nums, target):
        def first():
            lo, hi, ans = 0, len(nums)-1, -1
            while lo <= hi:
                mid = (lo+hi)//2
                if nums[mid] >= target: hi = mid-1
                else: lo = mid+1
                if nums[mid] == target: ans = mid
            return ans
        def last():
            lo, hi, ans = 0, len(nums)-1, -1
            while lo <= hi:
                mid = (lo+hi)//2
                if nums[mid] <= target: lo = mid+1
                else: hi = mid-1
                if nums[mid] == target: ans = mid
            return ans
        return [first(), last()]`,
typescriptCode: `class Solution {
  searchRange(nums: number[], target: number): number[] {
    const first = (): number => {
      let lo = 0, hi = nums.length - 1, ans = -1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (nums[mid] >= target) hi = mid - 1; else lo = mid + 1;
        if (nums[mid] === target) ans = mid;
      }
      return ans;
    };
    const last = (): number => {
      let lo = 0, hi = nums.length - 1, ans = -1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (nums[mid] <= target) lo = mid + 1; else hi = mid - 1;
        if (nums[mid] === target) ans = mid;
      }
      return ans;
    };
    return [first(), last()];
  }
}`,
javaCode: `
class Solution {
    public int[] searchRange(int[] nums, int target) {
        int first = -1, last = -1;
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) { first = mid; hi = mid - 1; }
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        lo = 0; hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) { last = mid; lo = mid + 1; }
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return new int[]{first, last};
    }
}
`,
cppCode: `class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        auto lo = lower_bound(nums.begin(), nums.end(), target);
        auto hi = upper_bound(nums.begin(), nums.end(), target);
        if (lo == hi) return {-1, -1};
        return {int(lo - nums.begin()), int(hi - nums.begin() - 1)};
    }
};`,
},
  35: {
pythonCode: `class Solution:
    def searchInsert(self, nums, target):
        left = 0
        right = len(nums)
        while left < right:
            mid = (left + right) // 2
            if nums[mid] < target:
                left = mid + 1
            else:
                right = mid
        return left`,
typescriptCode: `class Solution {
  searchInsert(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] < target) left = mid + 1;
      else right = mid;
    }
    return left;
  }
}`,
javaCode: `
class Solution {
    public int searchInsert(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return lo;
    }
}
`,
cppCode: `class Solution {
public:
    int searchInsert(vector<int>& nums, int target) {
        int lo = 0, hi = nums.size()-1;
        while (lo <= hi) { int m = (lo+hi)/2;
            if (nums[m] == target) return m;
            else if (nums[m] < target) lo = m+1; else hi = m-1; }
        return lo;
    }
};`,
brutePythonCode: `class Solution:
    def searchInsert(self, nums, target):
        for i in range(len(nums)):
            if nums[i] >= target:
                return i
        return len(nums)`,
bruteTypeScriptCode: `class Solution {
  searchInsert(nums: number[], target: number): number {
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] >= target) return i;
    }
    return nums.length;
  }
}`,
},
  36: {
pythonCode: `class Solution:
    def isValidSudoku(self, board):
        seen = set()
        for i in range(9):
            for j in range(9):
                c = board[i][j]
                if c == '.': continue
                row = f'{c}r{i}'
                col = f'{c}c{j}'
                box = f'{c}b{i//3}{j//3}'
                if row in seen or col in seen or box in seen:
                    return False
                seen.add(row)
                seen.add(col)
                seen.add(box)
        return True`,
typescriptCode: `class Solution {
  isValidSudoku(board: string[][]): boolean {
    const seen = new Set<string>();
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 9; j++) {
        const c = board[i][j]; if (c === '.') continue;
        if (!seen.add(\`\${c}r\${i}\`) || !seen.add(\`\${c}c\${j}\`) || !seen.add(\`\${c}b\${Math.floor(i/3)}\${Math.floor(j/3)}\`))
          return false;
      }
    return true;
  }
}`,
javaCode: `
class Solution {
    public boolean isValidSudoku(char[][] board) {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                char ch = board[i][j];
                if (ch == '.') continue;
                if (!seen.add(ch + " in row " + i) || !seen.add(ch + " in col " + j) || !seen.add(ch + " in box " + (i / 3) + "-" + (j / 3)))
                    return false;
            }
        }
        return true;
    }
}
`,
cppCode: `class Solution {
public:
    bool isValidSudoku(vector<vector<char>>& board) {
        unordered_set<string> seen;
        for (int i = 0; i < 9; i++)
            for (int j = 0; j < 9; j++) {
                char c = board[i][j];
                if (c == '.') continue;
                if (!seen.insert(string(1,c)+"r"+to_string(i)).second ||
                    !seen.insert(string(1,c)+"c"+to_string(j)).second ||
                    !seen.insert(string(1,c)+"b"+to_string(i/3)+to_string(j/3)).second) return false;
            }
        return true;
    }
};`,
},
  39: {
pythonCode: `class Solution:
    def combinationSum(self, candidates, target):
        result = []
        def bt(start, cur, total):
            if total == target: result.append(cur[:]); return
            if total > target: return
            for i in range(start, len(candidates)):
                cur.append(candidates[i])
                bt(i, cur, total + candidates[i])
                cur.pop()
        bt(0, [], 0)
        return result`,
typescriptCode: `class Solution {
  combinationSum(candidates: number[], target: number): number[][] {
    const result: number[][] = [];
    const bt = (start: number, cur: number[], total: number): void => {
      if (total === target) { result.push([...cur]); return; }
      if (total > target) return;
      for (let i = start; i < candidates.length; i++) {
        cur.push(candidates[i]); bt(i, cur, total + candidates[i]); cur.pop();
      }
    };
    bt(0, [], 0);
    return result;
  }
}`,
javaCode: `
class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), candidates, target, 0);
        return result;
    }
    private void backtrack(List<List<Integer>> result, List<Integer> current, int[] candidates, int remaining, int start) {
        if (remaining == 0) { result.add(new ArrayList<>(current)); return; }
        for (int i = start; i < candidates.length; i++) {
            if (candidates[i] > remaining) continue;
            current.add(candidates[i]);
            backtrack(result, current, candidates, remaining - candidates[i], i);
            current.remove(current.size() - 1);
        }
    }
}
`,
cppCode: `class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        vector<vector<int>> r; vector<int> cur;
        function<void(int,int)> bt = [&](int s, int rem) {
            if (rem == 0) { r.push_back(cur); return; }
            for (int i = s; i < candidates.size(); i++) {
                if (candidates[i] > rem) continue;
                cur.push_back(candidates[i]); bt(i, rem-candidates[i]); cur.pop_back();
            }
        };
        bt(0, target); return r;
    }
};`,
},
  42: {
pythonCode: `class Solution:
    def trap(self, height):
        left = 0
        right = len(height) - 1
        left_max = 0
        right_max = 0
        total = 0
        while left < right:
            if height[left] < height[right]:
                if height[left] >= left_max:
                    left_max = height[left]
                else:
                    total += left_max - height[left]
                left += 1
            else:
                if height[right] >= right_max:
                    right_max = height[right]
                else:
                    total += right_max - height[right]
                right -= 1
        return total`,
typescriptCode: `class Solution {
  trap(height: number[]): number {
    let left = 0;
    let right = height.length - 1;
    let leftMax = 0;
    let rightMax = 0;
    let total = 0;
    while (left < right) {
      if (height[left] < height[right]) {
        if (height[left] >= leftMax) leftMax = height[left];
        else total += leftMax - height[left];
        left++;
      } else {
        if (height[right] >= rightMax) rightMax = height[right];
        else total += rightMax - height[right];
        right--;
      }
    }
    return total;
  }
}`,
javaCode: `
class Solution {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0, total = 0;
        while (left < right) {
            if (height[left] < height[right]) {
                if (height[left] >= leftMax) leftMax = height[left];
                else total += leftMax - height[left];
                left++;
            } else {
                if (height[right] >= rightMax) rightMax = height[right];
                else total += rightMax - height[right];
                right--;
            }
        }
        return total;
    }
}
`,
cppCode: `
class Solution {
public:
    int trap(vector<int>& height) {
        int l = 0, r = height.size() - 1, lMax = 0, rMax = 0, total = 0;
        while (l < r) {
            if (height[l] < height[r]) { if (height[l] >= lMax) lMax = height[l]; else total += lMax - height[l]; l++; }
            else { if (height[r] >= rMax) rMax = height[r]; else total += rMax - height[r]; r--; }
        }
        return total;
    }
};`,
brutePythonCode: `class Solution:
    def trap(self, height):
        total = 0
        for i in range(len(height)):
            left_max = max(height[:i + 1])
            right_max = max(height[i:])
            total += min(left_max, right_max) - height[i]
        return total`,
bruteTypeScriptCode: `class Solution {
  trap(height: number[]): number {
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
},
  45: {
pythonCode: `class Solution:
    def jump(self, nums):
        jumps = cur_end = farthest = 0
        for i in range(len(nums) - 1):
            farthest = max(farthest, i + nums[i])
            if i == cur_end:
                jumps += 1
                cur_end = farthest
        return jumps`,
typescriptCode: `class Solution {
  jump(nums: number[]): number {
    let jumps = 0, curEnd = 0, farthest = 0;
    for (let i = 0; i < nums.length - 1; i++) {
      farthest = Math.max(farthest, i + nums[i]);
      if (i === curEnd) { jumps++; curEnd = farthest; }
    }
    return jumps;
  }
}`,
javaCode: `
class Solution {
    public int jump(int[] nums) {
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == curEnd) { jumps++; curEnd = farthest; }
        }
        return jumps;
    }
}
`,
cppCode: `
class Solution {
public:
    int jump(vector<int>& nums) {
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < (int)nums.size() - 1; i++) {
            farthest = max(farthest, i + nums[i]);
            if (i == curEnd) { jumps++; curEnd = farthest; }
        }
        return jumps;
    }
};`,
},
  46: {
pythonCode: `class Solution:
    def permute(self, nums):
        result = []
        def backtrack(path, remaining):
            if not remaining:
                result.append(list(path))
                return
            for i in range(len(remaining)):
                backtrack(path + [remaining[i]], remaining[:i] + remaining[i + 1:])
        backtrack([], nums)
        return result`,
typescriptCode: `class Solution {
  permute(nums: number[]): number[][] {
    const result: number[][] = [];
    const backtrack = (path: number[], remaining: number[]) => {
      if (remaining.length === 0) {
        result.push([...path]);
        return;
      }
      for (let i = 0; i < remaining.length; i++) {
        backtrack(
          [...path, remaining[i]],
          [...remaining.slice(0, i), ...remaining.slice(i + 1)],
        );
      }
    };
    backtrack([], nums);
    return result;
  }
}`,
javaCode: `
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), nums);
        return result;
    }
    private void backtrack(List<List<Integer>> result, List<Integer> current, int[] nums) {
        if (current.size() == nums.length) { result.add(new ArrayList<>(current)); return; }
        for (int num : nums) {
            if (current.contains(num)) continue;
            current.add(num);
            backtrack(result, current, nums);
            current.remove(current.size() - 1);
        }
    }
}
`,
cppCode: `class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> r; vector<int> cur;
        function<void()> bt = [&]() {
            if (cur.size() == nums.size()) { r.push_back(cur); return; }
            for (int n : nums) {
                if (find(cur.begin(), cur.end(), n) != cur.end()) continue;
                cur.push_back(n); bt(); cur.pop_back();
            }
        };
        bt(); return r;
    }
};`,
},
  48: {
pythonCode: `class Solution:
    def rotate(self, matrix):
        n = len(matrix)
        for layer in range(n // 2):
            first = layer
            last = n - 1 - layer
            for i in range(first, last):
                offset = i - first
                top = matrix[first][i]
                matrix[first][i] = matrix[last - offset][first]
                matrix[last - offset][first] = matrix[last][last - offset]
                matrix[last][last - offset] = matrix[i][last]
                matrix[i][last] = top`,
typescriptCode: `class Solution {
  rotate(matrix: number[][]): void {
    const n = matrix.length;
    for (let layer = 0; layer < Math.floor(n / 2); layer++) {
      const first = layer;
      const last = n - 1 - layer;
      for (let i = first; i < last; i++) {
        const offset = i - first;
        const top = matrix[first][i];
        matrix[first][i] = matrix[last - offset][first];
        matrix[last - offset][first] = matrix[last][last - offset];
        matrix[last][last - offset] = matrix[i][last];
        matrix[i][last] = top;
      }
    }
  }
}`,
javaCode: `
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) {
                int tmp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = tmp;
            }
        for (int[] row : matrix) {
            int left = 0, right = n - 1;
            while (left < right) {
                int tmp = row[left];
                row[left++] = row[right];
                row[right--] = tmp;
            }
        }
    }
}
`,
cppCode: `
class Solution {
public:
    void rotate(vector<vector<int>>& matrix) {
        int n=matrix.size();
        for(int i=0;i<n;i++)for(int j=i+1;j<n;j++)swap(matrix[i][j],matrix[j][i]);
        for(auto& row:matrix)reverse(row.begin(),row.end());
    }
};`,
brutePythonCode: `class Solution:
    def rotate(self, matrix):
        n = len(matrix)
        copy = [row[:] for row in matrix]
        for r in range(n):
            for c in range(n):
                matrix[c][n - 1 - r] = copy[r][c]`,
bruteTypeScriptCode: `class Solution {
  rotate(matrix: number[][]): void {
    const n = matrix.length;
    const copy = matrix.map((row) => row.slice());
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        matrix[c][n - 1 - r] = copy[r][c];
      }
    }
  }
}`,
},
  49: {
pythonCode: `class Solution:
    def groupAnagrams(self, strs):
        groups = {}
        for word in strs:
            key = "".join(sorted(word))
            if key not in groups:
                groups[key] = []
            groups[key].append(word)
        return list(groups.values())`,
typescriptCode: `class Solution {
  groupAnagrams(strs: string[]): string[][] {
    const groups = new Map<string, string[]>();
    for (const word of strs) {
      const key = word.split("").sort().join("");
      const group = groups.get(key) ?? [];
      group.push(word);
      groups.set(key, group);
    }
    return [...groups.values()];
  }
}`,
javaCode: `
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(map.values());
    }
}
`,
cppCode: `
class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string,vector<string>> m;
        for(string&s:strs){string k=s;sort(k.begin(),k.end());m[k].push_back(s);}
        vector<vector<string>> r;for(auto& p:m)r.push_back(p.second);return r;
    }
};`,
brutePythonCode: `class Solution:
    def groupAnagrams(self, strs):
        groups = []
        for word in strs:
            key = "".join(sorted(word))
            placed = False
            for group in groups:
                if group[0] == key:
                    group[1].append(word)
                    placed = True
                    break
            if not placed:
                groups.append([key, [word]])
        return [group[1] for group in groups]`,
bruteTypeScriptCode: `class Solution {
  groupAnagrams(strs: string[]): string[][] {
    const groups: Array<[string, string[]]> = [];
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
},
  50: {
pythonCode: `class Solution:
    def myPow(self, x, n):
        if n == 0:
            return 1
        if n < 0:
            return 1 / self.myPow(x, -n)
        half = self.myPow(x, n // 2)
        if n % 2 == 0:
            return half * half
        return half * half * x`,
typescriptCode: `class Solution {
  myPow(x: number, n: number): number {
    if (n === 0) return 1;
    if (n < 0) return 1 / this.myPow(x, -n);
    const half = this.myPow(x, Math.floor(n / 2));
    if (n % 2 === 0) return half * half;
    return half * half * x;
  }
}`,
javaCode: `
class Solution {
    public double myPow(double x, long n) {
        if (n < 0) { x = 1 / x; n = -n; }
        double result = 1;
        while (n > 0) {
            if ((n & 1) == 1) result *= x;
            x *= x;
            n >>= 1;
        }
        return result;
    }
}
`,
cppCode: `class Solution {
public:
    double myPow(double x, long n) {
        if (n < 0) { x = 1/x; n = -n; }
        double result = 1;
        while (n > 0) { if (n&1) result *= x; x *= x; n >>= 1; }
        return result;
    }
};`,
brutePythonCode: `class Solution:
    def myPow(self, x, n):
        if n == 0:
            return 1
        result = 1
        for _ in range(abs(n)):
            result *= x
        return result if n > 0 else 1 / result`,
bruteTypeScriptCode: `class Solution {
  myPow(x: number, n: number): number {
    if (n === 0) return 1;
    let result = 1;
    const steps = Math.abs(n);
    for (let i = 0; i < steps; i++) result *= x;
    return n < 0 ? 1 / result : result;
  }
}`,
},
  52: {
pythonCode: `class Solution:
    def totalNQueens(self, n):
        self.count = 0
        board = [-1]*n
        def bt(row):
            if row == n: self.count += 1; return
            for col in range(n):
                valid = True
                for prev in range(row):
                    if board[prev]==col or abs(board[prev]-col)==abs(prev-row): valid=False; break
                if valid: board[row]=col; bt(row+1)
        bt(0)
        return self.count`,
typescriptCode: `class Solution {
  private count = 0;
  totalNQueens(n: number): number {
    this.count = 0;
    const board = new Array(n).fill(-1);
    const bt = (row: number): void => {
      if (row === n) { this.count++; return; }
      for (let col = 0; col < n; col++) {
        let ok = true;
        for (let p = 0; p < row; p++)
          if (board[p]===col||Math.abs(board[p]-col)===Math.abs(p-row)) { ok=false; break; }
        if (ok) { board[row]=col; bt(row+1); }
      }
    };
    bt(0);
    return this.count;
  }
}`,
javaCode: `
class Solution {
    int count = 0;
    public int totalNQueens(int n) {
        count = 0;
        backtrack(new int[n], 0, n);
        return count;
    }
    private void backtrack(int[] cols, int row, int n) {
        if (row == n) { count++; return; }
        for (int col = 0; col < n; col++) {
            if (isValid(cols, row, col)) {
                cols[row] = col;
                backtrack(cols, row + 1, n);
            }
        }
    }
    private boolean isValid(int[] cols, int row, int col) {
        for (int i = 0; i < row; i++) {
            if (cols[i] == col || Math.abs(cols[i] - col) == row - i) return false;
        }
        return true;
    }
}
`,
cppCode: `class Solution {
public:
    int totalNQueens(int n) {
        int count = 0;
        vector<int> cols(n);
        function<void(int)> bt = [&](int row) {
            if (row == n) { count++; return; }
            for (int col = 0; col < n; col++) {
                bool ok = true;
                for (int i = 0; i < row; i++)
                    if (cols[i]==col || abs(cols[i]-col)==row-i) { ok = false; break; }
                if (ok) { cols[row] = col; bt(row+1); }
            }
        };
        bt(0); return count;
    }
};`,
},
  53: {
pythonCode: `class Solution:
    def maxSubArray(self, nums):
        best = nums[0]
        current = 0
        for num in nums:
            current = max(num, current + num)
            best = max(best, current)
        return best`,
typescriptCode: `class Solution {
  maxSubArray(nums: number[]): number {
    let best = nums[0];
    let current = 0;
    for (const num of nums) {
      current = Math.max(num, current + num);
      best = Math.max(best, current);
    }
    return best;
  }
}`,
javaCode: `
class Solution {
    public int maxSubArray(int[] nums) {
        int maxSum = nums[0], currSum = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currSum = Math.max(nums[i], currSum + nums[i]);
            maxSum = Math.max(maxSum, currSum);
        }
        return maxSum;
    }
}
`,
cppCode: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxSum = nums[0], curSum = nums[0];
        for (int i = 1; i < nums.size(); i++) {
            curSum = max(nums[i], curSum + nums[i]);
            maxSum = max(maxSum, curSum);
        }
        return maxSum;
    }
};`,
brutePythonCode: `class Solution:
    def maxSubArray(self, nums):
        best = float("-inf")
        for i in range(len(nums)):
            total = 0
            for j in range(i, len(nums)):
                total += nums[j]
                best = max(best, total)
        return best`,
bruteTypeScriptCode: `class Solution {
  maxSubArray(nums: number[]): number {
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
},
  54: {
pythonCode: `class Solution:
    def spiralOrder(self, matrix):
        result = []
        if not matrix: return result
        top, bottom, left, right = 0, len(matrix)-1, 0, len(matrix[0])-1
        while top <= bottom and left <= right:
            for i in range(left, right+1): result.append(matrix[top][i])
            top += 1
            for i in range(top, bottom+1): result.append(matrix[i][right])
            right -= 1
            if top <= bottom:
                for i in range(right, left-1, -1): result.append(matrix[bottom][i])
                bottom -= 1
            if left <= right:
                for i in range(bottom, top-1, -1): result.append(matrix[i][left])
                left += 1
        return result`,
typescriptCode: `class Solution {
  spiralOrder(matrix: number[][]): number[] {
    const r: number[] = [];
    if (!matrix.length) return r;
    let t = 0, b = matrix.length-1, l = 0, ri = matrix[0].length-1;
    while (t <= b && l <= ri) {
      for (let i = l; i <= ri; i++) r.push(matrix[t][i]); t++;
      for (let i = t; i <= b; i++) r.push(matrix[i][ri]); ri--;
      if (t <= b) { for (let i = ri; i >= l; i--) r.push(matrix[b][i]); b--; }
      if (l <= ri) { for (let i = b; i >= t; i--) r.push(matrix[i][l]); l++; }
    }
    return r;
  }
}`,
javaCode: `
class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> result = new ArrayList<>();
        if (matrix.length == 0) return result;
        int top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int i = left; i <= right; i++) result.add(matrix[top][i]);
            top++;
            for (int i = top; i <= bottom; i++) result.add(matrix[i][right]);
            right--;
            if (top <= bottom) {
                for (int i = right; i >= left; i--) result.add(matrix[bottom][i]);
                bottom--;
            }
            if (left <= right) {
                for (int i = bottom; i >= top; i--) result.add(matrix[i][left]);
                left++;
            }
        }
        return result;
    }
}
`,
cppCode: `
class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& m) {
        vector<int> r; if(m.empty())return r;
        int t=0,b=m.size()-1,l=0,ri=m[0].size()-1;
        while(t<=b&&l<=ri){for(int i=l;i<=ri;i++)r.push_back(m[t][i]);t++;
            for(int i=t;i<=b;i++)r.push_back(m[i][ri]);ri--;
            if(t<=b){for(int i=ri;i>=l;i--)r.push_back(m[b][i]);b--;}
            if(l<=ri){for(int i=b;i>=t;i--)r.push_back(m[i][l]);l++;}}
        return r;
    }
};`,
},
  55: {
pythonCode: `class Solution:
    def canJump(self, nums):
        max_reach = 0
        for i in range(len(nums)):
            if i > max_reach: return False
            max_reach = max(max_reach, i + nums[i])
        return True`,
typescriptCode: `class Solution {
  canJump(nums: number[]): boolean {
    let maxReach = 0;
    for (let i = 0; i < nums.length; i++) {
      if (i > maxReach) return false;
      maxReach = Math.max(maxReach, i + nums[i]);
    }
    return true;
  }
}`,
javaCode: `
class Solution {
    public boolean canJump(int[] nums) {
        int maxReach = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > maxReach) return false;
            maxReach = Math.max(maxReach, i + nums[i]);
        }
        return true;
    }
}
`,
cppCode: `
class Solution {
public:
    bool canJump(vector<int>& nums) {
        int maxReach = 0;
        for (int i = 0; i < nums.size(); i++) {
            if (i > maxReach) return false;
            maxReach = max(maxReach, i + nums[i]);
        }
        return true;
    }
};`,
},
  56: {
pythonCode: `class Solution:
    def merge(self, intervals):
        intervals.sort()
        result = []
        for iv in intervals:
            if not result or result[-1][1] < iv[0]: result.append(iv)
            else: result[-1][1] = max(result[-1][1], iv[1])
        return result`,
typescriptCode: `class Solution {
  merge(intervals: number[][]): number[][] {
    intervals.sort((a, b) => a[0] - b[0]);
    const r: number[][] = [];
    for (const iv of intervals)
      if (!r.length || r[r.length-1][1] < iv[0]) r.push(iv);
      else r[r.length-1][1] = Math.max(r[r.length-1][1], iv[1]);
    return r;
  }
}`,
javaCode: `
class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> result = new ArrayList<>();
        for (int[] interval : intervals) {
            if (result.isEmpty() || result.get(result.size() - 1)[1] < interval[0])
                result.add(interval);
            else
                result.get(result.size() - 1)[1] = Math.max(result.get(result.size() - 1)[1], interval[1]);
        }
        return result.toArray(new int[result.size()][]);
    }
}
`,
cppCode: `
class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(),intervals.end()); vector<vector<int>> r;
        for(auto& iv:intervals){if(r.empty()||r.back()[1]<iv[0])r.push_back(iv);else r.back()[1]=max(r.back()[1],iv[1]);}
        return r;
    }
};`,
},
  57: {
pythonCode: `class Solution:
    def insert(self, intervals, newInterval):
        result = []
        i = 0
        while i < len(intervals) and intervals[i][1] < newInterval[0]:
            result.append(intervals[i]); i += 1
        while i < len(intervals) and intervals[i][0] <= newInterval[1]:
            newInterval[0] = min(newInterval[0], intervals[i][0])
            newInterval[1] = max(newInterval[1], intervals[i][1]); i += 1
        result.append(newInterval)
        while i < len(intervals): result.append(intervals[i]); i += 1
        return result`,
typescriptCode: `class Solution {
  insert(intervals: number[][], newInterval: number[]): number[][] {
    const r: number[][] = []; let i = 0;
    while (i < intervals.length && intervals[i][1] < newInterval[0]) r.push(intervals[i++]);
    while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
      newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
      newInterval[1] = Math.max(newInterval[1], intervals[i][1]); i++;
    }
    r.push(newInterval);
    while (i < intervals.length) r.push(intervals[i++]);
    return r;
  }
}`,
javaCode: `
class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> result = new ArrayList<>();
        int i = 0;
        while (i < intervals.length && intervals[i][1] < newInterval[0]) result.add(intervals[i++]);
        while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
            i++;
        }
        result.add(newInterval);
        while (i < intervals.length) result.add(intervals[i++]);
        return result.toArray(new int[result.size()][]);
    }
}
`,
cppCode: `
class Solution {
public:
    vector<vector<int>> insert(vector<vector<int>>& intervals, vector<int>& ni) {
        vector<vector<int>> r; int i=0;
        while(i<intervals.size()&&intervals[i][1]<ni[0])r.push_back(intervals[i++]);
        while(i<intervals.size()&&intervals[i][0]<=ni[1]){ni[0]=min(ni[0],intervals[i][0]);ni[1]=max(ni[1],intervals[i][1]);i++;}
        r.push_back(ni);while(i<intervals.size())r.push_back(intervals[i++]);return r;
    }
};`,
},
  58: {
pythonCode: `class Solution:
    def lengthOfLastWord(self, s):
        return len(s.strip().split()[-1])`,
typescriptCode: `class Solution {
  lengthOfLastWord(s: string): number {
    return s.trim().split(' ').pop()!.length;
  }
}`,
javaCode: `
class Solution {
    public int lengthOfLastWord(String s) {
        int i = s.length() - 1;
        while (i >= 0 && s.charAt(i) == ' ') i--;
        int len = 0;
        while (i >= 0 && s.charAt(i) != ' ') { len++; i--; }
        return len;
    }
}
`,
cppCode: `
class Solution {
public:
    int lengthOfLastWord(string s) {
        int i = s.size()-1;
        while(i>=0&&s[i]==' ') i--;
        int len=0;
        while(i>=0&&s[i]!=' '){len++;i--;}
        return len;
    }
};`,
},
  61: {
pythonCode: `class Solution:
    def rotateRight(self, head, k):
        if not head or not head.next or k == 0: return head
        length = 1
        tail = head
        while tail.next: tail = tail.next; length += 1
        k %= length
        if k == 0: return head
        tail.next = head
        new_tail = head
        for _ in range(length - k - 1): new_tail = new_tail.next
        new_head = new_tail.next
        new_tail.next = None
        return new_head`,
typescriptCode: `class Solution {
  rotateRight(head: ListNode | null, k: number): ListNode | null {
    if (!head || !head.next || k === 0) return head;
    let len = 1, tail: any = head;
    while (tail.next) { tail = tail.next; len++; }
    k %= len; if (k === 0) return head;
    tail.next = head;
    let newTail: any = head;
    for (let i = 0; i < len - k - 1; i++) newTail = newTail.next;
    const newHead = newTail.next;
    newTail.next = null;
    return newHead;
  }
}`,
javaCode: `
class Solution {
    public ListNode rotateRight(ListNode head, int k) {
        if (head == null || head.next == null || k == 0) return head;
        ListNode tail = head;
        int len = 1;
        while (tail.next != null) { tail = tail.next; len++; }
        k %= len;
        if (k == 0) return head;
        tail.next = head;
        ListNode newTail = head;
        for (int i = 0; i < len - k - 1; i++) newTail = newTail.next;
        ListNode newHead = newTail.next;
        newTail.next = null;
        return newHead;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* rotateRight(ListNode* head, int k) {
        if (!head || !head->next || k == 0) return head;
        ListNode* tail = head; int len = 1;
        while (tail->next) { tail = tail->next; len++; }
        k %= len; if (k == 0) return head;
        tail->next = head;
        ListNode* newTail = head;
        for (int i = 0; i < len - k - 1; i++) newTail = newTail->next;
        ListNode* newHead = newTail->next;
        newTail->next = nullptr;
        return newHead;
    }
};`,
},
  63: {
pythonCode: `class Solution:
    def uniquePathsWithObstacles(self, obstacleGrid):
        rows, cols = len(obstacleGrid), len(obstacleGrid[0])
        dp = [[0]*cols for _ in range(rows)]
        if obstacleGrid[0][0] == 0: dp[0][0] = 1
        for r in range(rows):
            for c in range(cols):
                if obstacleGrid[r][c] == 1: dp[r][c] = 0
                else:
                    if r > 0: dp[r][c] += dp[r-1][c]
                    if c > 0: dp[r][c] += dp[r][c-1]
        return dp[rows-1][cols-1]`,
typescriptCode: `class Solution {
  uniquePathsWithObstacles(obstacleGrid: number[][]): number {
    const rows = obstacleGrid.length, cols = obstacleGrid[0].length;
    const dp = Array.from({length: rows}, () => new Array(cols).fill(0));
    if (obstacleGrid[0][0] === 0) dp[0][0] = 1;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (obstacleGrid[r][c] === 1) { dp[r][c] = 0; continue; }
      if (r > 0) dp[r][c] += dp[r - 1][c];
      if (c > 0) dp[r][c] += dp[r][c - 1];
    }
    return dp[rows - 1][cols - 1];
  }
}`,
javaCode: `
class Solution {
    public int uniquePathsWithObstacles(int[][] obstacleGrid) {
        int m = obstacleGrid.length, n = obstacleGrid[0].length;
        int[] dp = new int[n];
        dp[0] = obstacleGrid[0][0] == 0 ? 1 : 0;
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (obstacleGrid[i][j] == 1) dp[j] = 0;
                else if (j > 0) dp[j] += dp[j - 1];
            }
        }
        return dp[n - 1];
    }
}
`,
cppCode: `class Solution {
public:
    int uniquePathsWithObstacles(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        vector<int> dp(n, 0); dp[0] = grid[0][0] == 0 ? 1 : 0;
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 1) dp[j] = 0;
                else if (j > 0) dp[j] += dp[j-1];
            }
        return dp[n-1];
    }
};`,
},
  64: {
pythonCode: `class Solution:
    def minPathSum(self, grid):
        rows = len(grid)
        cols = len(grid[0])
        for r in range(rows):
            for c in range(cols):
                if r == 0 and c == 0:
                    continue
                from_top = grid[r - 1][c] if r > 0 else float("inf")
                from_left = grid[r][c - 1] if c > 0 else float("inf")
                grid[r][c] += min(from_top, from_left)
        return grid[rows - 1][cols - 1]`,
typescriptCode: `class Solution {
  minPathSum(grid: number[][]): number {
    const rows = grid.length;
    const cols = grid[0].length;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue;
        const fromTop = r > 0 ? grid[r - 1][c] : Infinity;
        const fromLeft = c > 0 ? grid[r][c - 1] : Infinity;
        grid[r][c] += Math.min(fromTop, fromLeft);
      }
    }
    return grid[rows - 1][cols - 1];
  }
}`,
javaCode: `
class Solution {
    public int minPathSum(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[] dp = new int[n];
        dp[0] = grid[0][0];
        for (int j = 1; j < n; j++) dp[j] = dp[j - 1] + grid[0][j];
        for (int i = 1; i < m; i++) {
            dp[0] += grid[i][0];
            for (int j = 1; j < n; j++) {
                dp[j] = grid[i][j] + Math.min(dp[j], dp[j - 1]);
            }
        }
        return dp[n - 1];
    }
}
`,
cppCode: `class Solution {
public:
    int minPathSum(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size();
        vector<int> dp(n); dp[0] = grid[0][0];
        for (int j = 1; j < n; j++) dp[j] = dp[j-1] + grid[0][j];
        for (int i = 1; i < m; i++) {
            dp[0] += grid[i][0];
            for (int j = 1; j < n; j++) dp[j] = grid[i][j] + min(dp[j], dp[j-1]);
        }
        return dp[n-1];
    }
};`,
brutePythonCode: `class Solution:
    def minPathSum(self, grid):
        def best(r, c):
            if r == len(grid) - 1 and c == len(grid[0]) - 1:
                return grid[r][c]
            if r == len(grid) - 1:
                return grid[r][c] + best(r, c + 1)
            if c == len(grid[0]) - 1:
                return grid[r][c] + best(r + 1, c)
            return grid[r][c] + min(best(r + 1, c), best(r, c + 1))
        return best(0, 0)`,
bruteTypeScriptCode: `class Solution {
  minPathSum(grid: number[][]): number {
    const best = (r: number, c: number): number => {
      if (r === grid.length - 1 && c === grid[0].length - 1) return grid[r][c];
      if (r === grid.length - 1) return grid[r][c] + best(r, c + 1);
      if (c === grid[0].length - 1) return grid[r][c] + best(r + 1, c);
      return grid[r][c] + Math.min(best(r + 1, c), best(r, c + 1));
    };
    return best(0, 0);
  }
}`,
},
  66: {
pythonCode: `class Solution:
    def plusOne(self, digits):
        for i in range(len(digits)-1, -1, -1):
            if digits[i] < 9: digits[i] += 1; return digits
            digits[i] = 0
        return [1] + digits`,
typescriptCode: `class Solution {
  plusOne(digits: number[]): number[] {
    for (let i = digits.length - 1; i >= 0; i--) {
      if (digits[i] < 9) { digits[i]++; return digits; }
      digits[i] = 0;
    }
    return [1, ...digits];
  }
}`,
javaCode: `
class Solution {
    public int[] plusOne(int[] digits) {
        for (int i = digits.length - 1; i >= 0; i--) {
            if (digits[i] < 9) { digits[i]++; return digits; }
            digits[i] = 0;
        }
        int[] result = new int[digits.length + 1];
        result[0] = 1;
        return result;
    }
}
`,
cppCode: `class Solution {
public:
    vector<int> plusOne(vector<int>& digits) {
        for (int i = digits.size()-1; i >= 0; i--) {
            if (digits[i] < 9) { digits[i]++; return digits; }
            digits[i] = 0;
        }
        digits.insert(digits.begin(), 1);
        return digits;
    }
};`,
},
  67: {
pythonCode: `class Solution:
    def addBinary(self, a, b):
        i, j, carry = len(a)-1, len(b)-1, 0
        result = []
        while i >= 0 or j >= 0 or carry:
            total = carry
            if i >= 0: total += int(a[i]); i -= 1
            if j >= 0: total += int(b[j]); j -= 1
            result.append(str(total % 2))
            carry = total // 2
        return ''.join(reversed(result))`,
typescriptCode: `class Solution {
  addBinary(a: string, b: string): string {
    let i = a.length - 1, j = b.length - 1, carry = 0;
    const result: string[] = [];
    while (i >= 0 || j >= 0 || carry) {
      const total = carry + (i >= 0 ? parseInt(a[i--]) : 0) + (j >= 0 ? parseInt(b[j--]) : 0);
      result.push(String(total % 2));
      carry = Math.floor(total / 2);
    }
    return result.reverse().join('');
  }
}`,
javaCode: `
class Solution {
    public String addBinary(String a, String b) {
        StringBuilder sb = new StringBuilder();
        int i = a.length() - 1, j = b.length() - 1, carry = 0;
        while (i >= 0 || j >= 0 || carry > 0) {
            int sum = carry;
            if (i >= 0) sum += a.charAt(i--) - '0';
            if (j >= 0) sum += b.charAt(j--) - '0';
            sb.append(sum % 2);
            carry = sum / 2;
        }
        return sb.reverse().toString();
    }
}
`,
cppCode: `class Solution {
public:
    string addBinary(string a, string b) {
        string result; int i = a.size()-1, j = b.size()-1, carry = 0;
        while (i >= 0 || j >= 0 || carry) {
            int sum = carry;
            if (i >= 0) sum += a[i--] - '0';
            if (j >= 0) sum += b[j--] - '0';
            result = char(sum%2 + '0') + result;
            carry = sum / 2;
        }
        return result;
    }
};`,
},
  69: {
pythonCode: `class Solution:
    def mySqrt(self, x):
        if x < 2: return x
        lo, hi = 1, x // 2
        while lo <= hi:
            mid = (lo+hi)//2
            if mid*mid == x: return mid
            elif mid*mid < x: lo = mid+1
            else: hi = mid-1
        return hi`,
typescriptCode: `class Solution {
  mySqrt(x: number): number {
    if (x < 2) return x;
    let lo = 1, hi = Math.floor(x / 2);
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (mid * mid === x) return mid;
      if (mid * mid < x) lo = mid + 1; else hi = mid - 1;
    }
    return hi;
  }
}`,
javaCode: `
class Solution {
    public int mySqrt(int x) {
        if (x == 0) return 0;
        int lo = 1, hi = x;
        while (lo <= hi) {
            long mid = lo + (hi - lo) / 2;
            if (mid * mid == x) return (int) mid;
            else if (mid * mid < x) lo = (int) mid + 1;
            else hi = (int) mid - 1;
        }
        return hi;
    }
}
`,
cppCode: `class Solution {
public:
    int mySqrt(int x) {
        if (x == 0) return 0;
        int lo = 1, hi = x;
        while (lo <= hi) { long m = lo + (hi-lo)/2;
            if (m*m == x) return m;
            else if (m*m < x) lo = m+1; else hi = m-1; }
        return hi;
    }
};`,
},
  70: {
pythonCode: `class Solution:
    def climbStairs(self, n):
        if n <= 2:
            return n
        a = 1
        b = 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b`,
typescriptCode: `class Solution {
  climbStairs(n: number): number {
    if (n <= 2) return n;
    let a = 1;
    let b = 2;
    for (let i = 3; i <= n; i++) {
      const next = a + b;
      a = b;
      b = next;
    }
    return b;
  }
}`,
javaCode: `
class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }
}
`,
cppCode: `class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) { int c = a+b; a = b; b = c; }
        return b;
    }
};`,
brutePythonCode: `class Solution:
    def climbStairs(self, n):
        if n <= 2:
            return n
        return self.climbStairs(n - 1) + self.climbStairs(n - 2)`,
bruteTypeScriptCode: `class Solution {
  climbStairs(n: number): number {
    if (n <= 2) return n;
    return this.climbStairs(n - 1) + this.climbStairs(n - 2);
  }
}`,
},
  71: {
pythonCode: `class Solution:
    def simplifyPath(self, path):
        stack = []
        for part in path.split('/'):
            if part == '' or part == '.': continue
            elif part == '..':
                if stack: stack.pop()
            else: stack.append(part)
        return '/' + '/'.join(stack)`,
typescriptCode: `class Solution {
  simplifyPath(path: string): string {
    const stack: string[] = [];
    for (const part of path.split('/')) {
      if (!part || part === '.') continue;
      else if (part === '..') stack.pop();
      else stack.push(part);
    }
    return '/' + stack.join('/');
  }
}`,
javaCode: `
class Solution {
    public String simplifyPath(String path) {
        Deque<String> stack = new ArrayDeque<>();
        for (String part : path.split("/")) {
            if (part.equals("") || part.equals(".")) continue;
            else if (part.equals("..")) stack.pollFirst();
            else stack.push(part);
        }
        StringBuilder sb = new StringBuilder();
        for (String s : stack) sb.append("/").append(s);
        return sb.length() == 0 ? "/" : sb.toString();
    }
}
`,
cppCode: `
class Solution {
public:
    string simplifyPath(string path) {
        vector<string> st; string part; path+="/";
        for(char c:path){if(c=='/'){if(part==".."&&!st.empty())st.pop_back();else if(part!=""&&part!="."&&part!="..")st.push_back(part);part="";}else part+=c;}
        string r;for(auto&s:st)r+="/"+s;return r.empty()?"/":r;
    }
};`,
},
  72: {
pythonCode: `class Solution:
    def minDistance(self, word1, word2):
        m, n = len(word1), len(word2)
        dp = [[0]*(n+1) for _ in range(m+1)]
        for i in range(m+1): dp[i][0] = i
        for j in range(n+1): dp[0][j] = j
        for i in range(1, m+1):
            for j in range(1, n+1):
                if word1[i-1] == word2[j-1]: dp[i][j] = dp[i-1][j-1]
                else: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
        return dp[m][n]`,
typescriptCode: `class Solution {
  minDistance(word1: string, word2: string): number {
    const m = word1.length, n = word2.length;
    const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      if (word1[i-1] === word2[j-1]) dp[i][j] = dp[i-1][j-1];
      else dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
    return dp[m][n];
  }
}`,
javaCode: `
class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[] dp = new int[n + 1];
        for (int j = 0; j <= n; j++) dp[j] = j;
        for (int i = 1; i <= m; i++) {
            int prev = dp[0];
            dp[0] = i;
            for (int j = 1; j <= n; j++) {
                int temp = dp[j];
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[j] = prev;
                else dp[j] = 1 + Math.min(prev, Math.min(dp[j], dp[j - 1]));
                prev = temp;
            }
        }
        return dp[n];
    }
}
`,
cppCode: `class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<int> dp(n+1);
        for (int j = 0; j <= n; j++) dp[j] = j;
        for (int i = 1; i <= m; i++) {
            int prev = dp[0]; dp[0] = i;
            for (int j = 1; j <= n; j++) {
                int tmp = dp[j];
                if (word1[i-1] == word2[j-1]) dp[j] = prev;
                else dp[j] = 1 + min({prev, dp[j], dp[j-1]});
                prev = tmp;
            }
        }
        return dp[n];
    }
};`,
},
  73: {
pythonCode: `class Solution:
    def setZeroes(self, matrix):
        m, n = len(matrix), len(matrix[0])
        rows = set()
        cols = set()
        for i in range(m):
            for j in range(n):
                if matrix[i][j] == 0:
                    rows.add(i)
                    cols.add(j)
        for i in range(m):
            for j in range(n):
                if i in rows or j in cols:
                    matrix[i][j] = 0`,
typescriptCode: `class Solution {
  setZeroes(matrix: number[][]): void {
    const m = matrix.length, n = matrix[0].length;
    const rows = new Set<number>(), cols = new Set<number>();
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        if (matrix[i][j] === 0) { rows.add(i); cols.add(j); }
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        if (rows.has(i) || cols.has(j)) matrix[i][j] = 0;
  }
}`,
javaCode: `
class Solution {
    public void setZeroes(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        boolean[] row = new boolean[m], col = new boolean[n];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (matrix[i][j] == 0) { row[i] = true; col[j] = true; }
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                if (row[i] || col[j]) matrix[i][j] = 0;
    }
}
`,
cppCode: `
class Solution {
public:
    void setZeroes(vector<vector<int>>& matrix) {
        int m=matrix.size(),n=matrix[0].size(); vector<bool> row(m,false),col(n,false);
        for(int i=0;i<m;i++)for(int j=0;j<n;j++)if(matrix[i][j]==0){row[i]=true;col[j]=true;}
        for(int i=0;i<m;i++)for(int j=0;j<n;j++)if(row[i]||col[j])matrix[i][j]=0;
    }
};`,
},
  74: {
pythonCode: `class Solution:
    def searchMatrix(self, matrix, target):
        rows, cols = len(matrix), len(matrix[0])
        lo, hi = 0, rows * cols - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            val = matrix[mid // cols][mid % cols]
            if val == target: return True
            elif val < target: lo = mid + 1
            else: hi = mid - 1
        return False`,
typescriptCode: `class Solution {
  searchMatrix(matrix: number[][], target: number): boolean {
    const rows = matrix.length, cols = matrix[0].length;
    let lo = 0, hi = rows * cols - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const val = matrix[Math.floor(mid / cols)][mid % cols];
      if (val === target) return true;
      if (val < target) lo = mid + 1; else hi = mid - 1;
    }
    return false;
  }
}`,
javaCode: `
class Solution {
    public boolean searchMatrix(int[][] matrix, int target) {
        int m = matrix.length, n = matrix[0].length;
        int lo = 0, hi = m * n - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            int val = matrix[mid / n][mid % n];
            if (val == target) return true;
            else if (val < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }
}
`,
cppCode: `class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int m = matrix.size(), n = matrix[0].size();
        int lo = 0, hi = m*n-1;
        while (lo <= hi) { int mid = (lo+hi)/2;
            int val = matrix[mid/n][mid%n];
            if (val == target) return true;
            else if (val < target) lo = mid+1; else hi = mid-1; }
        return false;
    }
};`,
},
  76: {
pythonCode: `class Solution:
    def minWindow(self, s, t):
        from collections import Counter
        need = Counter(t)
        missing = len(t)
        left = 0
        best = ""
        for right in range(len(s)):
            if need[s[right]] > 0:
                missing -= 1
            need[s[right]] -= 1
            while missing == 0:
                if best == "" or right - left + 1 < len(best):
                    best = s[left:right + 1]
                need[s[left]] += 1
                if need[s[left]] > 0:
                    missing += 1
                left += 1
        return best`,
typescriptCode: `class Solution {
  minWindow(s: string, t: string): string {
    const need = new Map<string, number>();
    for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
    let missing = t.length;
    let left = 0;
    let best = "";
    for (let right = 0; right < s.length; right++) {
      const current = s[right];
      if ((need.get(current) ?? 0) > 0) missing--;
      need.set(current, (need.get(current) ?? 0) - 1);
      while (missing === 0) {
        if (best === "" || right - left + 1 < best.length) best = s.slice(left, right + 1);
        const outgoing = s[left];
        need.set(outgoing, (need.get(outgoing) ?? 0) + 1);
        if ((need.get(outgoing) ?? 0) > 0) missing++;
        left++;
      }
    }
    return best;
  }
}`,
javaCode: `
class Solution {
    public String minWindow(String s, String t) {
        if (s.isEmpty() || t.isEmpty()) return "";
        Map<Character, Integer> need = new HashMap<>();
        Map<Character, Integer> have = new HashMap<>();
        for (char ch : t.toCharArray()) need.put(ch, need.getOrDefault(ch, 0) + 1);
        int required = need.size(), formed = 0;
        int left = 0, minLen = Integer.MAX_VALUE, minStart = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            have.put(ch, have.getOrDefault(ch, 0) + 1);
            if (need.containsKey(ch) && have.get(ch).intValue() == need.get(ch).intValue()) formed++;
            while (formed == required) {
                if (right - left + 1 < minLen) { minLen = right - left + 1; minStart = left; }
                char lc = s.charAt(left);
                have.put(lc, have.get(lc) - 1);
                if (need.containsKey(lc) && have.get(lc) < need.get(lc)) formed--;
                left++;
            }
        }
        return minLen == Integer.MAX_VALUE ? "" : s.substring(minStart, minStart + minLen);
    }
}
`,
cppCode: `
class Solution {
public:
    string minWindow(string s, string t) {
        if(s.empty()||t.empty())return "";
        unordered_map<char,int> need,have;
        for(char c:t)need[c]++;
        int required=need.size(),formed=0,l=0,minLen=INT_MAX,minStart=0;
        for(int r=0;r<s.size();r++){char c=s[r];have[c]++;
            if(need.count(c)&&have[c]==need[c])formed++;
            while(formed==required){if(r-l+1<minLen){minLen=r-l+1;minStart=l;}
                have[s[l]]--;if(need.count(s[l])&&have[s[l]]<need[s[l]])formed--;l++;}
        }
        return minLen==INT_MAX?"":s.substr(minStart,minLen);
    }
};`,
brutePythonCode: `class Solution:
    def minWindow(self, s, t):
        from collections import Counter
        need = Counter(t)
        best = ""
        for i in range(len(s)):
            for j in range(i, len(s)):
                window = s[i:j + 1]
                if len(window) >= len(t):
                    counts = Counter(window)
                    ok = True
                    for ch in need:
                        if counts[ch] < need[ch]:
                            ok = False
                            break
                    if ok and (best == "" or len(window) < len(best)):
                        best = window
        return best`,
bruteTypeScriptCode: `class Solution {
  minWindow(s: string, t: string): string {
    const need = new Map<string, number>();
    for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
    let best = "";
    for (let i = 0; i < s.length; i++) {
      for (let j = i; j < s.length; j++) {
        const window = s.slice(i, j + 1);
        if (window.length >= t.length && this.containsAll(window, need)) {
          if (best === "" || window.length < best.length) best = window;
        }
      }
    }
    return best;
  }
  containsAll(window: string, need: Map<string, number>): boolean {
    const counts = new Map<string, number>();
    for (const ch of window) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    for (const [ch, required] of need) {
      if ((counts.get(ch) ?? 0) < required) return false;
    }
    return true;
  }
}`,
},
  77: {
pythonCode: `class Solution:
    def combine(self, n, k):
        result = []
        def bt(start, cur):
            if len(cur) == k: result.append(cur[:]); return
            for i in range(start, n+1):
                cur.append(i)
                bt(i+1, cur)
                cur.pop()
        bt(1, [])
        return result`,
typescriptCode: `class Solution {
  combine(n: number, k: number): number[][] {
    const result: number[][] = [];
    const bt = (start: number, cur: number[]): void => {
      if (cur.length === k) { result.push([...cur]); return; }
      for (let i = start; i <= n; i++) { cur.push(i); bt(i + 1, cur); cur.pop(); }
    };
    bt(1, []);
    return result;
  }
}`,
javaCode: `
class Solution {
    public List<List<Integer>> combine(int n, int k) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), n, k, 1);
        return result;
    }
    private void backtrack(List<List<Integer>> result, List<Integer> current, int n, int k, int start) {
        if (current.size() == k) { result.add(new ArrayList<>(current)); return; }
        for (int i = start; i <= n; i++) {
            current.add(i);
            backtrack(result, current, n, k, i + 1);
            current.remove(current.size() - 1);
        }
    }
}
`,
cppCode: `class Solution {
public:
    vector<vector<int>> combine(int n, int k) {
        vector<vector<int>> r; vector<int> cur;
        function<void(int)> bt = [&](int s) {
            if (cur.size() == k) { r.push_back(cur); return; }
            for (int i = s; i <= n; i++) { cur.push_back(i); bt(i+1); cur.pop_back(); }
        };
        bt(1); return r;
    }
};`,
},
  79: {
pythonCode: `class Solution:
    def exist(self, board, word):
        rows, cols = len(board), len(board[0])
        def dfs(r, c, idx):
            if idx == len(word): return True
            if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != word[idx]: return False
            tmp = board[r][c]; board[r][c] = '#'
            found = dfs(r+1,c,idx+1) or dfs(r-1,c,idx+1) or dfs(r,c+1,idx+1) or dfs(r,c-1,idx+1)
            board[r][c] = tmp
            return found
        for r in range(rows):
            for c in range(cols):
                if dfs(r, c, 0): return True
        return False`,
typescriptCode: `class Solution {
  exist(board: string[][], word: string): boolean {
    const rows = board.length, cols = board[0].length;
    const dfs = (r: number, c: number, idx: number): boolean => {
      if (idx === word.length) return true;
      if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[idx]) return false;
      const tmp = board[r][c]; board[r][c] = '#';
      const found = dfs(r+1,c,idx+1)||dfs(r-1,c,idx+1)||dfs(r,c+1,idx+1)||dfs(r,c-1,idx+1);
      board[r][c] = tmp;
      return found;
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
    return false;
  }
}`,
javaCode: `
class Solution {
    public boolean exist(char[][] board, String word) {
        for (int i = 0; i < board.length; i++)
            for (int j = 0; j < board[0].length; j++)
                if (dfs(board, word, i, j, 0)) return true;
        return false;
    }
    private boolean dfs(char[][] board, String word, int r, int c, int idx) {
        if (idx == word.length()) return true;
        if (r < 0 || c < 0 || r >= board.length || c >= board[0].length || board[r][c] != word.charAt(idx)) return false;
        char tmp = board[r][c];
        board[r][c] = '#';
        boolean found = dfs(board, word, r + 1, c, idx + 1) || dfs(board, word, r - 1, c, idx + 1)
                || dfs(board, word, r, c + 1, idx + 1) || dfs(board, word, r, c - 1, idx + 1);
        board[r][c] = tmp;
        return found;
    }
}
`,
cppCode: `class Solution {
public:
    bool exist(vector<vector<char>>& board, string word) {
        for (int i = 0; i < board.size(); i++)
            for (int j = 0; j < board[0].size(); j++)
                if (dfs(board, word, i, j, 0)) return true;
        return false;
    }
    bool dfs(vector<vector<char>>& b, string& w, int r, int c, int idx) {
        if (idx == w.size()) return true;
        if (r<0||c<0||r>=b.size()||c>=b[0].size()||b[r][c]!=w[idx]) return false;
        char tmp = b[r][c]; b[r][c] = '#';
        bool found = dfs(b,w,r+1,c,idx+1)||dfs(b,w,r-1,c,idx+1)||dfs(b,w,r,c+1,idx+1)||dfs(b,w,r,c-1,idx+1);
        b[r][c] = tmp; return found;
    }
};`,
},
  80: {
pythonCode: `class Solution:
    def removeDuplicates(self, nums):
        if len(nums) <= 2: return len(nums)
        k = 2
        for i in range(2, len(nums)):
            if nums[i] != nums[k - 2]:
                nums[k] = nums[i]
                k += 1
        return k`,
typescriptCode: `class Solution {
  removeDuplicates(nums: number[]): number {
    if (nums.length <= 2) return nums.length;
    let k = 2;
    for (let i = 2; i < nums.length; i++) {
      if (nums[i] !== nums[k - 2]) nums[k++] = nums[i];
    }
    return k;
  }
}`,
javaCode: `
class Solution {
    public int removeDuplicates(int[] nums) {
        if (nums.length <= 2) return nums.length;
        int k = 2;
        for (int i = 2; i < nums.length; i++) {
            if (nums[i] != nums[k - 2]) nums[k++] = nums[i];
        }
        return k;
    }
}
`,
cppCode: `
class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        if (nums.size() <= 2) return nums.size();
        int k = 2;
        for (int i = 2; i < nums.size(); i++) {
            if (nums[i] != nums[k - 2]) nums[k++] = nums[i];
        }
        return k;
    }
};`,
},
  82: {
pythonCode: `class Solution:
    def deleteDuplicates(self, head):
        dummy = ListNode(0, head)
        prev = dummy
        while head:
            if head.next and head.val == head.next.val:
                while head.next and head.val == head.next.val:
                    head = head.next
                prev.next = head.next
            else:
                prev = prev.next
            head = head.next
        return dummy.next`,
typescriptCode: `class Solution {
  deleteDuplicates(head: ListNode | null): ListNode | null {
    const dummy = new ListNode(0, head);
    let prev = dummy, curr = head;
    while (curr) {
      if (curr.next && curr.val === curr.next.val) {
        while (curr.next && curr.val === curr.next.val) curr = curr.next;
        prev.next = curr.next;
      } else prev = prev.next;
      curr = curr.next;
    }
    return dummy.next;
  }
}`,
javaCode: `
class Solution {
    public ListNode deleteDuplicates(ListNode head) {
        ListNode dummy = new ListNode(0, head);
        ListNode prev = dummy;
        while (head != null) {
            if (head.next != null && head.val == head.next.val) {
                while (head.next != null && head.val == head.next.val) head = head.next;
                prev.next = head.next;
            } else {
                prev = prev.next;
            }
            head = head.next;
        }
        return dummy.next;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* deleteDuplicates(ListNode* head) {
        ListNode dummy(0); dummy.next = head;
        ListNode* prev = &dummy;
        while (head) {
            if (head->next && head->val == head->next->val) {
                while (head->next && head->val == head->next->val) head = head->next;
                prev->next = head->next;
            } else prev = prev->next;
            head = head->next;
        }
        return dummy.next;
    }
};`,
},
  86: {
pythonCode: `class Solution:
    def partition(self, head, x):
        less = ListNode(0)
        greater = ListNode(0)
        l, g = less, greater
        while head:
            if head.val < x:
                l.next = head; l = l.next
            else:
                g.next = head; g = g.next
            head = head.next
        g.next = None
        l.next = greater.next
        return less.next`,
typescriptCode: `class Solution {
  partition(head: ListNode | null, x: number): ListNode | null {
    const less = new ListNode(0), greater = new ListNode(0);
    let l = less, g = greater, curr = head;
    while (curr) {
      if (curr.val < x) { l.next = curr; l = l.next; }
      else { g.next = curr; g = g.next; }
      curr = curr.next;
    }
    g.next = null; l.next = greater.next;
    return less.next;
  }
}`,
javaCode: `
class Solution {
    public ListNode partition(ListNode head, int x) {
        ListNode lessHead = new ListNode(0), greaterHead = new ListNode(0);
        ListNode less = lessHead, greater = greaterHead;
        while (head != null) {
            if (head.val < x) { less.next = head; less = less.next; }
            else { greater.next = head; greater = greater.next; }
            head = head.next;
        }
        greater.next = null;
        less.next = greaterHead.next;
        return lessHead.next;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* partition(ListNode* head, int x) {
        ListNode lessHead(0), greaterHead(0);
        ListNode *less = &lessHead, *greater = &greaterHead;
        while (head) {
            if (head->val < x) { less->next = head; less = less->next; }
            else { greater->next = head; greater = greater->next; }
            head = head->next;
        }
        greater->next = nullptr;
        less->next = greaterHead.next;
        return lessHead.next;
    }
};`,
},
  88: {
pythonCode: `class Solution:
    def merge(self, nums1, m, nums2, n):
        i = m - 1
        j = n - 1
        k = m + n - 1
        while j >= 0:
            if i >= 0 and nums1[i] > nums2[j]:
                nums1[k] = nums1[i]
                i -= 1
            else:
                nums1[k] = nums2[j]
                j -= 1
            k -= 1`,
typescriptCode: `class Solution {
  merge(nums1: number[], m: number, nums2: number[], n: number): void {
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
javaCode: `
class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
            if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
            else nums1[k--] = nums2[j--];
        }
    }
}
`,
cppCode: `
class Solution {
public:
    void merge(vector<int>& nums1, int m, vector<int>& nums2, int n) {
        int i = m - 1, j = n - 1, k = m + n - 1;
        while (j >= 0) {
            if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
            else nums1[k--] = nums2[j--];
        }
    }
};`,
brutePythonCode: `class Solution:
    def merge(self, nums1, m, nums2, n):
        merged = sorted(nums1[:m] + nums2[:n])
        for i in range(len(merged)):
            nums1[i] = merged[i]`,
bruteTypeScriptCode: `class Solution {
  merge(nums1: number[], m: number, nums2: number[], n: number): void {
    const merged = nums1.slice(0, m).concat(nums2.slice(0, n)).sort((a, b) => a - b);
    for (let i = 0; i < merged.length; i++) nums1[i] = merged[i];
  }
}`,
},
  92: {
pythonCode: `class Solution:
    def reverseBetween(self, head, left, right):
        dummy = ListNode(0, head)
        prev = dummy
        for _ in range(left - 1): prev = prev.next
        curr = prev.next
        for _ in range(right - left):
            nxt = curr.next
            curr.next = nxt.next
            nxt.next = prev.next
            prev.next = nxt
        return dummy.next`,
typescriptCode: `class Solution {
  reverseBetween(head: ListNode | null, left: number, right: number): ListNode | null {
    const dummy = new ListNode(0, head);
    let prev: any = dummy;
    for (let i = 1; i < left; i++) prev = prev.next;
    let curr: any = prev.next;
    for (let i = 0; i < right - left; i++) {
      const nxt = curr.next;
      curr.next = nxt.next;
      nxt.next = prev.next;
      prev.next = nxt;
    }
    return dummy.next;
  }
}`,
javaCode: `
class Solution {
    public ListNode reverseBetween(ListNode head, int left, int right) {
        ListNode dummy = new ListNode(0, head);
        ListNode prev = dummy;
        for (int i = 1; i < left; i++) prev = prev.next;
        ListNode curr = prev.next;
        for (int i = 0; i < right - left; i++) {
            ListNode next = curr.next;
            curr.next = next.next;
            next.next = prev.next;
            prev.next = next;
        }
        return dummy.next;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* reverseBetween(ListNode* head, int left, int right) {
        ListNode dummy(0); dummy.next = head;
        ListNode* prev = &dummy;
        for (int i = 1; i < left; i++) prev = prev->next;
        ListNode* curr = prev->next;
        for (int i = 0; i < right - left; i++) {
            ListNode* nxt = curr->next;
            curr->next = nxt->next;
            nxt->next = prev->next;
            prev->next = nxt;
        }
        return dummy.next;
    }
};`,
},
  97: {
pythonCode: `class Solution:
    def isInterleave(self, s1, s2, s3):
        if len(s1)+len(s2) != len(s3): return False
        dp = [[False]*(len(s2)+1) for _ in range(len(s1)+1)]
        dp[0][0] = True
        for i in range(1, len(s1)+1): dp[i][0] = dp[i-1][0] and s1[i-1]==s3[i-1]
        for j in range(1, len(s2)+1): dp[0][j] = dp[0][j-1] and s2[j-1]==s3[j-1]
        for i in range(1, len(s1)+1):
            for j in range(1, len(s2)+1):
                dp[i][j] = (dp[i-1][j] and s1[i-1]==s3[i+j-1]) or (dp[i][j-1] and s2[j-1]==s3[i+j-1])
        return dp[len(s1)][len(s2)]`,
typescriptCode: `class Solution {
  isInterleave(s1: string, s2: string, s3: string): boolean {
    if (s1.length + s2.length !== s3.length) return false;
    const dp = Array.from({length: s1.length+1}, () => new Array(s2.length+1).fill(false));
    dp[0][0] = true;
    for (let i = 1; i <= s1.length; i++) dp[i][0] = dp[i-1][0] && s1[i-1]===s3[i-1];
    for (let j = 1; j <= s2.length; j++) dp[0][j] = dp[0][j-1] && s2[j-1]===s3[j-1];
    for (let i = 1; i <= s1.length; i++) for (let j = 1; j <= s2.length; j++)
      dp[i][j] = (dp[i-1][j]&&s1[i-1]===s3[i+j-1])||(dp[i][j-1]&&s2[j-1]===s3[i+j-1]);
    return dp[s1.length][s2.length];
  }
}`,
javaCode: `
class Solution {
    public boolean isInterleave(String s1, String s2, String s3) {
        int m = s1.length(), n = s2.length();
        if (m + n != s3.length()) return false;
        boolean[] dp = new boolean[n + 1];
        dp[0] = true;
        for (int j = 1; j <= n; j++) dp[j] = dp[j - 1] && s2.charAt(j - 1) == s3.charAt(j - 1);
        for (int i = 1; i <= m; i++) {
            dp[0] = dp[0] && s1.charAt(i - 1) == s3.charAt(i - 1);
            for (int j = 1; j <= n; j++) {
                dp[j] = (s1.charAt(i - 1) == s3.charAt(i + j - 1) && dp[j])
                    || (s2.charAt(j - 1) == s3.charAt(i + j - 1) && dp[j - 1]);
            }
        }
        return dp[n];
    }
}
`,
cppCode: `class Solution {
public:
    bool isInterleave(string s1, string s2, string s3) {
        int m = s1.size(), n = s2.size();
        if (m+n != s3.size()) return false;
        vector<bool> dp(n+1, false); dp[0] = true;
        for (int j = 1; j <= n; j++) dp[j] = dp[j-1] && s2[j-1] == s3[j-1];
        for (int i = 1; i <= m; i++) {
            dp[0] = dp[0] && s1[i-1] == s3[i-1];
            for (int j = 1; j <= n; j++)
                dp[j] = (s1[i-1]==s3[i+j-1] && dp[j]) || (s2[j-1]==s3[i+j-1] && dp[j-1]);
        }
        return dp[n];
    }
};`,
},
  98: {
pythonCode: `class Solution:
    def isValidBST(self, root):
        return self.check(root, float("-inf"), float("inf"))
    def check(self, node, low, high):
        if node is None:
            return True
        if node.val <= low or node.val >= high:
            return False
        return self.check(node.left, low, node.val) and self.check(node.right, node.val, high)`,
typescriptCode: `class Solution {
  isValidBST(root: TreeNode | null): boolean {
    return this.check(root, -Infinity, Infinity);
  }
  check(node: TreeNode | null, low: number, high: number): boolean {
    if (node === null) return true;
    if (node.val <= low || node.val >= high) return false;
    return this.check(node.left, low, node.val) && this.check(node.right, node.val, high);
  }
}`,
javaCode: `
class Solution {
    public boolean isValidBST(TreeNode root) {
        return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }
    private boolean validate(TreeNode node, long min, long max) {
        if (node == null) return true;
        if (node.val <= min || node.val >= max) return false;
        return validate(node.left, min, node.val) && validate(node.right, node.val, max);
    }
}
`,
cppCode: `class Solution {
public:
    bool isValidBST(TreeNode* root) { return valid(root, LONG_MIN, LONG_MAX); }
    bool valid(TreeNode* n, long mn, long mx) {
        if (!n) return true;
        if (n->val <= mn || n->val >= mx) return false;
        return valid(n->left, mn, n->val) && valid(n->right, n->val, mx);
    }
};`,
brutePythonCode: `class Solution:
    def isValidBST(self, root):
        values = []
        def walk(node):
            if node is None:
                return
            walk(node.left)
            values.append(node.val)
            walk(node.right)
        walk(root)
        for i in range(1, len(values)):
            if values[i] <= values[i - 1]:
                return False
        return True`,
bruteTypeScriptCode: `class Solution {
  isValidBST(root: TreeNode | null): boolean {
    const values: number[] = [];
    const walk = (node: TreeNode | null) => {
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
},
  100: {
pythonCode: `class Solution:
    def isSameTree(self, p, q):
        if not p and not q: return True
        if not p or not q: return False
        return p.val == q.val and self.isSameTree(p.left, q.left) and self.isSameTree(p.right, q.right)`,
typescriptCode: `class Solution {
  isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
    if (!p && !q) return true;
    if (!p || !q) return false;
    return p.val === q.val && this.isSameTree(p.left, q.left) && this.isSameTree(p.right, q.right);
  }
}`,
javaCode: `
class Solution {
    public boolean isSameTree(TreeNode p, TreeNode q) {
        if (p == null && q == null) return true;
        if (p == null || q == null) return false;
        return p.val == q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
    }
}
`,
cppCode: `class Solution {
public:
    bool isSameTree(TreeNode* p, TreeNode* q) {
        if (!p && !q) return true;
        if (!p || !q) return false;
        return p->val == q->val && isSameTree(p->left, q->left) && isSameTree(p->right, q->right);
    }
};`,
},
  101: {
pythonCode: `class Solution:
    def isSymmetric(self, root):
        if not root: return True
        def mirror(l, r):
            if not l and not r: return True
            if not l or not r: return False
            return l.val == r.val and mirror(l.left, r.right) and mirror(l.right, r.left)
        return mirror(root.left, root.right)`,
typescriptCode: `class Solution {
  isSymmetric(root: TreeNode | null): boolean {
    const mirror = (l: any, r: any): boolean => {
      if (!l && !r) return true;
      if (!l || !r) return false;
      return l.val === r.val && mirror(l.left, r.right) && mirror(l.right, r.left);
    };
    return mirror(root?.left, root?.right);
  }
}`,
javaCode: `
class Solution {
    public boolean isSymmetric(TreeNode root) {
        if (root == null) return true;
        return isMirror(root.left, root.right);
    }
    private boolean isMirror(TreeNode l, TreeNode r) {
        if (l == null && r == null) return true;
        if (l == null || r == null) return false;
        return l.val == r.val && isMirror(l.left, r.right) && isMirror(l.right, r.left);
    }
}
`,
cppCode: `class Solution {
public:
    bool isSymmetric(TreeNode* root) {
        if (!root) return true;
        return mirror(root->left, root->right);
    }
    bool mirror(TreeNode* l, TreeNode* r) {
        if (!l && !r) return true;
        if (!l || !r) return false;
        return l->val == r->val && mirror(l->left, r->right) && mirror(l->right, r->left);
    }
};`,
},
  102: {
pythonCode: `class Solution:
    def levelOrder(self, root):
        result = []
        if not root: return result
        from collections import deque
        queue = deque([root])
        while queue:
            level = []
            for _ in range(len(queue)):
                node = queue.popleft()
                level.append(node.val)
                if node.left: queue.append(node.left)
                if node.right: queue.append(node.right)
            result.append(level)
        return result`,
typescriptCode: `class Solution {
  levelOrder(root: TreeNode | null): number[][] {
    const r: number[][] = [];
    if (!root) return r;
    const q: any[] = [root];
    while (q.length) {
      const level: number[] = [];
      const sz = q.length;
      for (let i = 0; i < sz; i++) {
        const n = q.shift(); level.push(n.val);
        if (n.left) q.push(n.left);
        if (n.right) q.push(n.right);
      }
      r.push(level);
    }
    return r;
  }
}`,
javaCode: `
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            int size = queue.size();
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.add(node.left);
                if (node.right != null) queue.add(node.right);
            }
            result.add(level);
        }
        return result;
    }
}
`,
cppCode: `class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> r; if (!root) return r;
        queue<TreeNode*> q; q.push(root);
        while (!q.empty()) {
            int sz = q.size(); vector<int> level;
            for (int i = 0; i < sz; i++) {
                TreeNode* n = q.front(); q.pop();
                level.push_back(n->val);
                if (n->left) q.push(n->left);
                if (n->right) q.push(n->right);
            }
            r.push_back(level);
        }
        return r;
    }
};`,
},
  103: {
pythonCode: `class Solution:
    def zigzagLevelOrder(self, root):
        if not root:
            return []
        from collections import deque
        result, queue, left_to_right = [], deque([root]), True
        while queue:
            level = []
            for _ in range(len(queue)):
                node = queue.popleft()
                level.append(node.val)
                if node.left:
                    queue.append(node.left)
                if node.right:
                    queue.append(node.right)
            result.append(level if left_to_right else level[::-1])
            left_to_right = not left_to_right
        return result`,
typescriptCode: `class Solution {
  zigzagLevelOrder(root: TreeNode | null): number[][] {
    if (!root) return [];
    const result: number[][] = [];
    let queue: TreeNode[] = [root];
    let leftToRight = true;
    while (queue.length > 0) {
      const level: number[] = [];
      const next: TreeNode[] = [];
      for (const node of queue) {
        level.push(node.val);
        if (node.left) next.push(node.left);
        if (node.right) next.push(node.right);
      }
      result.push(leftToRight ? level : level.reverse());
      queue = next;
      leftToRight = !leftToRight;
    }
    return result;
  }
}`,
javaCode: `
class Solution {
    public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        boolean leftToRight = true;
        while (!queue.isEmpty()) {
            int size = queue.size();
            LinkedList<Integer> level = new LinkedList<>();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                if (leftToRight) level.addLast(node.val);
                else level.addFirst(node.val);
                if (node.left != null) queue.add(node.left);
                if (node.right != null) queue.add(node.right);
            }
            result.add(level);
            leftToRight = !leftToRight;
        }
        return result;
    }
}
`,
cppCode: `class Solution {
public:
    vector<vector<int>> zigzagLevelOrder(TreeNode* root) {
        vector<vector<int>> r; if (!root) return r;
        queue<TreeNode*> q; q.push(root); bool l2r = true;
        while (!q.empty()) {
            int sz = q.size(); deque<int> level;
            for (int i = 0; i < sz; i++) {
                TreeNode* n = q.front(); q.pop();
                if (l2r) level.push_back(n->val);
                else level.push_front(n->val);
                if (n->left) q.push(n->left);
                if (n->right) q.push(n->right);
            }
            r.push_back(vector<int>(level.begin(), level.end()));
            l2r = !l2r;
        }
        return r;
    }
};`,
},
  104: {
pythonCode: `class Solution:
    def maxDepth(self, root):
        if not root: return 0
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right))`,
typescriptCode: `class Solution {
  maxDepth(root: TreeNode | null): number {
    if (!root) return 0;
    return 1 + Math.max(this.maxDepth(root.left), this.maxDepth(root.right));
  }
}`,
javaCode: `
class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
    }
}
`,
cppCode: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (!root) return 0;
        return 1 + max(maxDepth(root->left), maxDepth(root->right));
    }
};`,
},
  105: {
pythonCode: `class Solution:
    def buildTree(self, preorder, inorder):
        if not preorder:
            return None
        root = TreeNode(preorder[0])
        mid = inorder.index(preorder[0])
        root.left = self.buildTree(preorder[1:mid+1], inorder[:mid])
        root.right = self.buildTree(preorder[mid+1:], inorder[mid+1:])
        return root`,
typescriptCode: `class Solution {
  buildTree(preorder: number[], inorder: number[]): TreeNode | null {
    if (!preorder.length) return null;
    const root = new TreeNode(preorder[0]);
    const mid = inorder.indexOf(preorder[0]);
    root.left = this.buildTree(preorder.slice(1, mid + 1), inorder.slice(0, mid));
    root.right = this.buildTree(preorder.slice(mid + 1), inorder.slice(mid + 1));
    return root;
  }
}`,
javaCode: `
class Solution {
    public TreeNode buildTree(int[] preorder, int[] inorder) {
        return build(preorder, 0, preorder.length - 1, inorder, 0, inorder.length - 1);
    }
    private TreeNode build(int[] pre, int ps, int pe, int[] in, int is, int ie) {
        if (ps > pe) return null;
        TreeNode root = new TreeNode(pre[ps]);
        int idx = is;
        while (in[idx] != pre[ps]) idx++;
        root.left = build(pre, ps + 1, ps + idx - is, in, is, idx - 1);
        root.right = build(pre, ps + idx - is + 1, pe, in, idx + 1, ie);
        return root;
    }
}
`,
cppCode: `class Solution {
public:
    TreeNode* buildTree(vector<int>& preorder, vector<int>& inorder) {
        return build(preorder, 0, preorder.size()-1, inorder, 0, inorder.size()-1);
    }
    TreeNode* build(vector<int>& pre, int ps, int pe, vector<int>& in, int is, int ie) {
        if (ps > pe) return nullptr;
        TreeNode* root = new TreeNode(pre[ps]);
        int idx = is;
        while (in[idx] != pre[ps]) idx++;
        root->left = build(pre, ps+1, ps+idx-is, in, is, idx-1);
        root->right = build(pre, ps+idx-is+1, pe, in, idx+1, ie);
        return root;
    }
};`,
},
  106: {
pythonCode: `class Solution:
    def buildTree(self, inorder, postorder):
        if not postorder:
            return None
        root = TreeNode(postorder[-1])
        mid = inorder.index(postorder[-1])
        root.left = self.buildTree(inorder[:mid], postorder[:mid])
        root.right = self.buildTree(inorder[mid+1:], postorder[mid:-1])
        return root`,
typescriptCode: `class Solution {
  buildTree(inorder: number[], postorder: number[]): TreeNode | null {
    if (!postorder.length) return null;
    const root = new TreeNode(postorder[postorder.length - 1]);
    const mid = inorder.indexOf(postorder[postorder.length - 1]);
    root.left = this.buildTree(inorder.slice(0, mid), postorder.slice(0, mid));
    root.right = this.buildTree(inorder.slice(mid + 1), postorder.slice(mid, -1));
    return root;
  }
}`,
javaCode: `
class Solution {
    public TreeNode buildTree(int[] inorder, int[] postorder) {
        return build(inorder, 0, inorder.length - 1, postorder, 0, postorder.length - 1);
    }
    private TreeNode build(int[] in, int is, int ie, int[] post, int ps, int pe) {
        if (is > ie) return null;
        TreeNode root = new TreeNode(post[pe]);
        int idx = is;
        while (in[idx] != post[pe]) idx++;
        root.left = build(in, is, idx - 1, post, ps, ps + idx - is - 1);
        root.right = build(in, idx + 1, ie, post, ps + idx - is, pe - 1);
        return root;
    }
}
`,
cppCode: `class Solution {
public:
    TreeNode* buildTree(vector<int>& inorder, vector<int>& postorder) {
        return build(inorder, 0, inorder.size()-1, postorder, 0, postorder.size()-1);
    }
    TreeNode* build(vector<int>& in, int is, int ie, vector<int>& post, int ps, int pe) {
        if (is > ie) return nullptr;
        TreeNode* root = new TreeNode(post[pe]);
        int idx = is;
        while (in[idx] != post[pe]) idx++;
        root->left = build(in, is, idx-1, post, ps, ps+idx-is-1);
        root->right = build(in, idx+1, ie, post, ps+idx-is, pe-1);
        return root;
    }
};`,
},
  108: {
pythonCode: `class Solution:
    def sortedArrayToBST(self, nums):
        if not nums:
            return None
        mid = len(nums) // 2
        root = TreeNode(nums[mid])
        root.left = self.sortedArrayToBST(nums[:mid])
        root.right = self.sortedArrayToBST(nums[mid + 1:])
        return root`,
typescriptCode: `class Solution {
  sortedArrayToBST(nums: number[]): TreeNode | null {
    if (nums.length === 0) return null;
    const mid = Math.floor(nums.length / 2);
    const root = new TreeNode(nums[mid]);
    root.left = this.sortedArrayToBST(nums.slice(0, mid));
    root.right = this.sortedArrayToBST(nums.slice(mid + 1));
    return root;
  }
}`,
javaCode: `
class Solution {
    public TreeNode sortedArrayToBST(int[] nums) {
        return build(nums, 0, nums.length - 1);
    }
    private TreeNode build(int[] nums, int left, int right) {
        if (left > right) return null;
        int mid = (left + right) / 2;
        TreeNode root = new TreeNode(nums[mid]);
        root.left = build(nums, left, mid - 1);
        root.right = build(nums, mid + 1, right);
        return root;
    }
}
`,
cppCode: `class Solution {
public:
    TreeNode* sortedArrayToBST(vector<int>& nums) {
        return build(nums, 0, nums.size()-1);
    }
    TreeNode* build(vector<int>& nums, int l, int r) {
        if (l > r) return nullptr;
        int m = (l+r)/2;
        TreeNode* root = new TreeNode(nums[m]);
        root->left = build(nums, l, m-1);
        root->right = build(nums, m+1, r);
        return root;
    }
};`,
},
  112: {
pythonCode: `class Solution:
    def hasPathSum(self, root, targetSum):
        if not root: return False
        if not root.left and not root.right: return targetSum == root.val
        return self.hasPathSum(root.left, targetSum - root.val) or self.hasPathSum(root.right, targetSum - root.val)`,
typescriptCode: `class Solution {
  hasPathSum(root: TreeNode | null, targetSum: number): boolean {
    if (!root) return false;
    if (!root.left && !root.right) return targetSum === root.val;
    return this.hasPathSum(root.left, targetSum - root.val) || this.hasPathSum(root.right, targetSum - root.val);
  }
}`,
javaCode: `
class Solution {
    public boolean hasPathSum(TreeNode root, int targetSum) {
        if (root == null) return false;
        if (root.left == null && root.right == null) return targetSum == root.val;
        return hasPathSum(root.left, targetSum - root.val) || hasPathSum(root.right, targetSum - root.val);
    }
}
`,
cppCode: `class Solution {
public:
    bool hasPathSum(TreeNode* root, int targetSum) {
        if (!root) return false;
        if (!root->left && !root->right) return targetSum == root->val;
        return hasPathSum(root->left, targetSum - root->val) || hasPathSum(root->right, targetSum - root->val);
    }
};`,
},
  114: {
pythonCode: `class Solution:
    def flatten(self, root):
        current = root
        while current:
            if current.left:
                rightmost = current.left
                while rightmost.right:
                    rightmost = rightmost.right
                rightmost.right = current.right
                current.right = current.left
                current.left = None
            current = current.right`,
typescriptCode: `class Solution {
  flatten(root: TreeNode | null): void {
    let current = root;
    while (current) {
      if (current.left) {
        let rightmost = current.left;
        while (rightmost.right) rightmost = rightmost.right;
        rightmost.right = current.right;
        current.right = current.left;
        current.left = null;
      }
      current = current.right;
    }
  }
}`,
javaCode: `
class Solution {
    public void flatten(TreeNode root) {
        TreeNode curr = root;
        while (curr != null) {
            if (curr.left != null) {
                TreeNode rightmost = curr.left;
                while (rightmost.right != null) rightmost = rightmost.right;
                rightmost.right = curr.right;
                curr.right = curr.left;
                curr.left = null;
            }
            curr = curr.right;
        }
    }
}
`,
cppCode: `class Solution {
public:
    void flatten(TreeNode* root) {
        TreeNode* curr = root;
        while (curr) {
            if (curr->left) {
                TreeNode* rightmost = curr->left;
                while (rightmost->right) rightmost = rightmost->right;
                rightmost->right = curr->right;
                curr->right = curr->left;
                curr->left = nullptr;
            }
            curr = curr->right;
        }
    }
};`,
},
  117: {
pythonCode: `class Solution:
    def connect(self, root):
        if not root: return None
        level = [root]
        while level:
            nxt = []
            for node in level:
                if node.left: nxt.append(node.left)
                if node.right: nxt.append(node.right)
            for i in range(len(nxt)-1): nxt[i].next = nxt[i+1]
            level = nxt
        return root`,
typescriptCode: `class Solution {
  connect(root: Node | null): Node | null {
    if (!root) return null;
    let level: Node[] = [root];
    while (level.length) {
      const next: Node[] = [];
      for (const node of level) {
        if (node.left) next.push(node.left);
        if (node.right) next.push(node.right);
      }
      for (let i = 0; i < next.length - 1; i++) next[i].next = next[i+1];
      level = next;
    }
    return root;
  }
}`,
javaCode: `
class Solution {
    public Node connect(Node root) {
        Node curr = root;
        while (curr != null) {
            Node dummy = new Node(0);
            Node tail = dummy;
            while (curr != null) {
                if (curr.left != null) { tail.next = curr.left; tail = tail.next; }
                if (curr.right != null) { tail.next = curr.right; tail = tail.next; }
                curr = curr.next;
            }
            curr = dummy.next;
        }
        return root;
    }
}
`,
cppCode: `class Solution {
public:
    Node* connect(Node* root) {
        Node* curr = root;
        while (curr) {
            Node dummy(0); Node* tail = &dummy;
            while (curr) {
                if (curr->left) { tail->next = curr->left; tail = tail->next; }
                if (curr->right) { tail->next = curr->right; tail = tail->next; }
                curr = curr->next;
            }
            curr = dummy.next;
        }
        return root;
    }
};`,
},
  120: {
pythonCode: `class Solution:
    def minimumTotal(self, triangle):
        dp = triangle[-1][:]
        for row in range(len(triangle)-2, -1, -1):
            for col in range(len(triangle[row])):
                dp[col] = triangle[row][col] + min(dp[col], dp[col+1])
        return dp[0]`,
typescriptCode: `class Solution {
  minimumTotal(triangle: number[][]): number {
    const dp = [...triangle[triangle.length - 1]];
    for (let row = triangle.length - 2; row >= 0; row--)
      for (let col = 0; col < triangle[row].length; col++)
        dp[col] = triangle[row][col] + Math.min(dp[col], dp[col + 1]);
    return dp[0];
  }
}`,
javaCode: `
class Solution {
    public int minimumTotal(List<List<Integer>> triangle) {
        int n = triangle.size();
        int[] dp = new int[n];
        for (int i = 0; i < n; i++) dp[i] = triangle.get(n - 1).get(i);
        for (int i = n - 2; i >= 0; i--) {
            for (int j = 0; j <= i; j++) {
                dp[j] = triangle.get(i).get(j) + Math.min(dp[j], dp[j + 1]);
            }
        }
        return dp[0];
    }
}
`,
cppCode: `class Solution {
public:
    int minimumTotal(vector<vector<int>>& triangle) {
        int n = triangle.size();
        vector<int> dp(triangle.back());
        for (int i = n-2; i >= 0; i--)
            for (int j = 0; j <= i; j++)
                dp[j] = triangle[i][j] + min(dp[j], dp[j+1]);
        return dp[0];
    }
};`,
},
  121: {
pythonCode: `class Solution:
    def maxProfit(self, prices):
        min_price = float("inf")
        best = 0
        for price in prices:
            min_price = min(min_price, price)
            best = max(best, price - min_price)
        return best`,
typescriptCode: `class Solution {
  maxProfit(prices: number[]): number {
    let minPrice = Infinity;
    let best = 0;
    for (const price of prices) {
      minPrice = Math.min(minPrice, price);
      best = Math.max(best, price - minPrice);
    }
    return best;
  }
}`,
javaCode: `
class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE, best = 0;
        for (int price : prices) {
            minPrice = Math.min(minPrice, price);
            best = Math.max(best, price - minPrice);
        }
        return best;
    }
}
`,
cppCode: `
class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = INT_MAX, best = 0;
        for (int p : prices) { minPrice = min(minPrice, p); best = max(best, p - minPrice); }
        return best;
    }
};`,
brutePythonCode: `class Solution:
    def maxProfit(self, prices):
        best = 0
        for i in range(len(prices)):
            for j in range(i + 1, len(prices)):
                best = max(best, prices[j] - prices[i])
        return best`,
bruteTypeScriptCode: `class Solution {
  maxProfit(prices: number[]): number {
    let best = 0;
    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        best = Math.max(best, prices[j] - prices[i]);
      }
    }
    return best;
  }
}`,
},
  122: {
pythonCode: `class Solution:
    def maxProfit(self, prices):
        return sum(max(0, prices[i] - prices[i-1]) for i in range(1, len(prices)))`,
typescriptCode: `class Solution {
  maxProfit(prices: number[]): number {
    let total = 0;
    for (let i = 1; i < prices.length; i++)
      if (prices[i] > prices[i-1]) total += prices[i] - prices[i-1];
    return total;
  }
}`,
javaCode: `
class Solution {
    public int maxProfit(int[] prices) {
        int total = 0;
        for (int i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) total += prices[i] - prices[i - 1];
        }
        return total;
    }
}
`,
cppCode: `
class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int total = 0;
        for (int i = 1; i < prices.size(); i++)
            if (prices[i] > prices[i-1]) total += prices[i] - prices[i-1];
        return total;
    }
};`,
},
  124: {
pythonCode: `class Solution:
    def maxPathSum(self, root):
        self.best = float('-inf')
        def dfs(node):
            if not node: return 0
            left = max(dfs(node.left), 0)
            right = max(dfs(node.right), 0)
            self.best = max(self.best, node.val + left + right)
            return node.val + max(left, right)
        dfs(root)
        return self.best`,
typescriptCode: `class Solution {
  private best = -Infinity;
  maxPathSum(root: TreeNode | null): number {
    this.best = -Infinity;
    const dfs = (node: TreeNode | null): number => {
      if (!node) return 0;
      const left = Math.max(dfs(node.left), 0);
      const right = Math.max(dfs(node.right), 0);
      this.best = Math.max(this.best, node.val + left + right);
      return node.val + Math.max(left, right);
    };
    dfs(root);
    return this.best;
  }
}`,
javaCode: `
class Solution {
    int maxSum = Integer.MIN_VALUE;
    public int maxPathSum(TreeNode root) {
        maxSum = Integer.MIN_VALUE;
        dfs(root);
        return maxSum;
    }
    private int dfs(TreeNode node) {
        if (node == null) return 0;
        int left = Math.max(0, dfs(node.left));
        int right = Math.max(0, dfs(node.right));
        maxSum = Math.max(maxSum, node.val + left + right);
        return node.val + Math.max(left, right);
    }
}
`,
cppCode: `class Solution {
public:
    int maxPathSum(TreeNode* root) {
        int maxSum = INT_MIN;
        function<int(TreeNode*)> dfs = [&](TreeNode* n) -> int {
            if (!n) return 0;
            int left = max(0, dfs(n->left)), right = max(0, dfs(n->right));
            maxSum = max(maxSum, n->val + left + right);
            return n->val + max(left, right);
        };
        dfs(root); return maxSum;
    }
};`,
},
  125: {
pythonCode: `class Solution:
    def isPalindrome(self, s):
        left = 0
        right = len(s) - 1
        while left < right:
            while left < right and not s[left].isalnum():
                left += 1
            while left < right and not s[right].isalnum():
                right -= 1
            if s[left].lower() != s[right].lower():
                return False
            left += 1
            right -= 1
        return True`,
typescriptCode: `class Solution {
  isPalindrome(s: string): boolean {
    let left = 0;
    let right = s.length - 1;
    while (left < right) {
      while (left < right && !/[a-z0-9]/i.test(s[left])) left++;
      while (left < right && !/[a-z0-9]/i.test(s[right])) right--;
      if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
      left++;
      right--;
    }
    return true;
  }
}`,
javaCode: `class Solution {
    public boolean isPalindrome(String s) {
        String cleaned = s.toLowerCase().replaceAll("[^a-z0-9]", "");
        return cleaned.equals(new StringBuilder(cleaned).reverse().toString());
    }
}`,
cppCode: `class Solution {
public:
    bool isPalindrome(string s) {
        string cleaned;
        for (char c : s) if (isalnum(c)) cleaned += tolower(c);
        string rev = cleaned; reverse(rev.begin(), rev.end());
        return cleaned == rev;
    }
};`,
brutePythonCode: `class Solution:
    def isPalindrome(self, s):
        cleaned = "".join(ch.lower() for ch in s if ch.isalnum())
        return cleaned == cleaned[::-1]`,
bruteTypeScriptCode: `class Solution {
  isPalindrome(s: string): boolean {
    const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleaned === cleaned.split("").reverse().join("");
  }
}`,
},
  127: {
pythonCode: `class Solution:
    def ladderLength(self, beginWord, endWord, wordList):
        ws = set(wordList)
        if endWord not in ws: return 0
        from collections import deque
        q = deque([(beginWord, 1)])
        visited = {beginWord}
        while q:
            word, length = q.popleft()
            for i in range(len(word)):
                for c in 'abcdefghijklmnopqrstuvwxyz':
                    nw = word[:i] + c + word[i+1:]
                    if nw == endWord: return length + 1
                    if nw in ws and nw not in visited:
                        visited.add(nw); q.append((nw, length+1))
        return 0`,
typescriptCode: `class Solution {
  ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
    const ws = new Set(wordList);
    if (!ws.has(endWord)) return 0;
    const q: [string, number][] = [[beginWord, 1]];
    const visited = new Set<string>([beginWord]);
    while (q.length) {
      const [word, len] = q.shift()!;
      for (let i = 0; i < word.length; i++)
        for (let c = 97; c <= 122; c++) {
          const nw = word.slice(0,i) + String.fromCharCode(c) + word.slice(i+1);
          if (nw === endWord) return len + 1;
          if (ws.has(nw) && !visited.has(nw)) { visited.add(nw); q.push([nw, len+1]); }
        }
    }
    return 0;
  }
}`,
javaCode: `
class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        Set<String> wordSet = new HashSet<>(wordList);
        if (!wordSet.contains(endWord)) return 0;
        Queue<String> queue = new LinkedList<>();
        queue.add(beginWord);
        int steps = 1;
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                char[] word = queue.poll().toCharArray();
                for (int j = 0; j < word.length; j++) {
                    char orig = word[j];
                    for (char ch = 'a'; ch <= 'z'; ch++) {
                        word[j] = ch;
                        String newWord = new String(word);
                        if (newWord.equals(endWord)) return steps + 1;
                        if (wordSet.remove(newWord)) queue.add(newWord);
                    }
                    word[j] = orig;
                }
            }
            steps++;
        }
        return 0;
    }
}
`,
cppCode: `class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> ws(wordList.begin(), wordList.end());
        if (!ws.count(endWord)) return 0;
        queue<string> q; q.push(beginWord); int steps = 1;
        while (!q.empty()) { int sz = q.size();
            for (int i = 0; i < sz; i++) {
                string w = q.front(); q.pop();
                for (int j = 0; j < w.size(); j++) {
                    char orig = w[j];
                    for (char c = 'a'; c <= 'z'; c++) { w[j] = c;
                        if (w == endWord) return steps+1;
                        if (ws.erase(w)) q.push(w); }
                    w[j] = orig;
                }
            }
            steps++;
        }
        return 0;
    }
};`,
},
  128: {
pythonCode: `class Solution:
    def longestConsecutive(self, nums):
        s = set(nums)
        best = 0
        for n in s:
            if n - 1 not in s:
                streak = 1
                while n + streak in s: streak += 1
                best = max(best, streak)
        return best`,
typescriptCode: `class Solution {
  longestConsecutive(nums: number[]): number {
    const s = new Set(nums); let best = 0;
    for (const n of s) {
      if (!s.has(n - 1)) {
        let streak = 1;
        while (s.has(n + streak)) streak++;
        best = Math.max(best, streak);
      }
    }
    return best;
  }
}`,
javaCode: `
class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int n : nums) set.add(n);
        int best = 0;
        for (int n : set) {
            if (!set.contains(n - 1)) {
                int streak = 1;
                while (set.contains(n + streak)) streak++;
                best = Math.max(best, streak);
            }
        }
        return best;
    }
}
`,
cppCode: `
class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<int> s(nums.begin(),nums.end());int best=0;
        for(int n:s){if(!s.count(n-1)){int streak=1;while(s.count(n+streak))streak++;best=max(best,streak);}}
        return best;
    }
};`,
},
  129: {
pythonCode: `class Solution:
    def sumNumbers(self, root):
        def dfs(node, current):
            if not node: return 0
            current = current * 10 + node.val
            if not node.left and not node.right: return current
            return dfs(node.left, current) + dfs(node.right, current)
        return dfs(root, 0)`,
typescriptCode: `class Solution {
  sumNumbers(root: TreeNode | null): number {
    const dfs = (n: any, cur: number): number => {
      if (!n) return 0; cur = cur * 10 + n.val;
      if (!n.left && !n.right) return cur;
      return dfs(n.left, cur) + dfs(n.right, cur);
    };
    return dfs(root, 0);
  }
}`,
javaCode: `
class Solution {
    public int sumNumbers(TreeNode root) {
        return dfs(root, 0);
    }
    private int dfs(TreeNode node, int current) {
        if (node == null) return 0;
        current = current * 10 + node.val;
        if (node.left == null && node.right == null) return current;
        return dfs(node.left, current) + dfs(node.right, current);
    }
}
`,
cppCode: `class Solution {
public:
    int sumNumbers(TreeNode* root) { return dfs(root, 0); }
    int dfs(TreeNode* n, int cur) {
        if (!n) return 0;
        cur = cur * 10 + n->val;
        if (!n->left && !n->right) return cur;
        return dfs(n->left, cur) + dfs(n->right, cur);
    }
};`,
},
  130: {
pythonCode: `class Solution:
    def solve(self, board):
        if not board:
            return
        rows, cols = len(board), len(board[0])
        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != 'O':
                return
            board[r][c] = 'S'
            dfs(r+1, c)
            dfs(r-1, c)
            dfs(r, c+1)
            dfs(r, c-1)
        for r in range(rows):
            for c in range(cols):
                if (r == 0 or r == rows-1 or c == 0 or c == cols-1) and board[r][c] == 'O':
                    dfs(r, c)
        for r in range(rows):
            for c in range(cols):
                if board[r][c] == 'O': board[r][c] = 'X'
                elif board[r][c] == 'S': board[r][c] = 'O'`,
typescriptCode: `class Solution {
  solve(board: string[][]): void {
    const rows = board.length, cols = board[0].length;
    const dfs = (r: number, c: number): void => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== 'O') return;
      board[r][c] = 'S';
      dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if ((r === 0 || r === rows - 1 || c === 0 || c === cols - 1) && board[r][c] === 'O') dfs(r, c);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        board[r][c] = board[r][c] === 'O' ? 'X' : board[r][c] === 'S' ? 'O' : board[r][c];
  }
}`,
javaCode: `
class Solution {
    public void solve(char[][] board) {
        int m = board.length, n = board[0].length;
        for (int i = 0; i < m; i++) { dfs(board, i, 0); dfs(board, i, n - 1); }
        for (int j = 0; j < n; j++) { dfs(board, 0, j); dfs(board, m - 1, j); }
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                if (board[i][j] == 'O') board[i][j] = 'X';
                else if (board[i][j] == 'S') board[i][j] = 'O';
            }
    }
    private void dfs(char[][] board, int r, int c) {
        if (r < 0 || c < 0 || r >= board.length || c >= board[0].length || board[r][c] != 'O') return;
        board[r][c] = 'S';
        dfs(board, r + 1, c); dfs(board, r - 1, c);
        dfs(board, r, c + 1); dfs(board, r, c - 1);
    }
}
`,
cppCode: `class Solution {
public:
    void solve(vector<vector<char>>& board) {
        int m = board.size(), n = board[0].size();
        for (int i = 0; i < m; i++) { dfs(board,i,0); dfs(board,i,n-1); }
        for (int j = 0; j < n; j++) { dfs(board,0,j); dfs(board,m-1,j); }
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                if (board[i][j] == 'O') board[i][j] = 'X';
                else if (board[i][j] == 'S') board[i][j] = 'O';
            }
    }
    void dfs(vector<vector<char>>& b, int r, int c) {
        if (r<0||c<0||r>=b.size()||c>=b[0].size()||b[r][c]!='O') return;
        b[r][c]='S'; dfs(b,r+1,c); dfs(b,r-1,c); dfs(b,r,c+1); dfs(b,r,c-1);
    }
};`,
},
  133: {
javaCode: `
class Solution {
    public Node cloneGraph(Node node) {
        if (node == null) return null;
        Map<Node, Node> map = new HashMap<>();
        return clone(node, map);
    }
    private Node clone(Node node, Map<Node, Node> map) {
        if (map.containsKey(node)) return map.get(node);
        Node copy = new Node(node.val);
        map.put(node, copy);
        for (Node neighbor : node.neighbors) copy.neighbors.add(clone(neighbor, map));
        return copy;
    }
}
`,
cppCode: `class Solution {
public:
    Node* cloneGraph(Node* node) {
        if (!node) return nullptr;
        unordered_map<Node*, Node*> m;
        return clone(node, m);
    }
    Node* clone(Node* node, unordered_map<Node*, Node*>& m) {
        if (m.count(node)) return m[node];
        Node* copy = new Node(node->val); m[node] = copy;
        for (auto nb : node->neighbors) copy->neighbors.push_back(clone(nb, m));
        return copy;
    }
};`,
},
  134: {
pythonCode: `class Solution:
    def canCompleteCircuit(self, gas, cost):
        total = curr = start = 0
        for i in range(len(gas)):
            diff = gas[i] - cost[i]
            total += diff
            curr += diff
            if curr < 0:
                start = i + 1
                curr = 0
        return start if total >= 0 else -1`,
typescriptCode: `class Solution {
  canCompleteCircuit(gas: number[], cost: number[]): number {
    let total = 0, curr = 0, start = 0;
    for (let i = 0; i < gas.length; i++) {
      const diff = gas[i] - cost[i]; total += diff; curr += diff;
      if (curr < 0) { start = i + 1; curr = 0; }
    }
    return total >= 0 ? start : -1;
  }
}`,
javaCode: `
class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int totalTank = 0, currTank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int diff = gas[i] - cost[i];
            totalTank += diff;
            currTank += diff;
            if (currTank < 0) { start = i + 1; currTank = 0; }
        }
        return totalTank >= 0 ? start : -1;
    }
}
`,
cppCode: `
class Solution {
public:
    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
        int total = 0, curr = 0, start = 0;
        for (int i = 0; i < gas.size(); i++) {
            int diff = gas[i] - cost[i]; total += diff; curr += diff;
            if (curr < 0) { start = i + 1; curr = 0; }
        }
        return total >= 0 ? start : -1;
    }
};`,
},
  136: {
pythonCode: `class Solution:
    def singleNumber(self, nums):
        result = 0
        for num in nums:
            result ^= num
        return result`,
typescriptCode: `class Solution {
  singleNumber(nums: number[]): number {
    let result = 0;
    for (const num of nums) result ^= num;
    return result;
  }
}`,
javaCode: `
class Solution {
    public int singleNumber(int[] nums) {
        int result = 0;
        for (int num : nums) result ^= num;
        return result;
    }
}
`,
cppCode: `class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int result = 0;
        for (int n : nums) result ^= n;
        return result;
    }
};`,
brutePythonCode: `class Solution:
    def singleNumber(self, nums):
        counts = {}
        for num in nums:
            counts[num] = counts.get(num, 0) + 1
        for num, count in counts.items():
            if count == 1:
                return num`,
bruteTypeScriptCode: `class Solution {
  singleNumber(nums: number[]): number {
    const counts = new Map<number, number>();
    for (const num of nums) counts.set(num, (counts.get(num) ?? 0) + 1);
    for (const [num, count] of counts) {
      if (count === 1) return num;
    }
    return 0;
  }
}`,
},
  137: {
pythonCode: `class Solution:
    def singleNumber(self, nums):
        ones = twos = 0
        for num in nums:
            ones = (ones ^ num) & ~twos
            twos = (twos ^ num) & ~ones
        return ones`,
typescriptCode: `class Solution {
  singleNumber(nums: number[]): number {
    let ones = 0, twos = 0;
    for (const num of nums) { ones = (ones ^ num) & ~twos; twos = (twos ^ num) & ~ones; }
    return ones;
  }
}`,
javaCode: `
class Solution {
    public int singleNumber(int[] nums) {
        int ones = 0, twos = 0;
        for (int num : nums) {
            ones = (ones ^ num) & ~twos;
            twos = (twos ^ num) & ~ones;
        }
        return ones;
    }
}
`,
cppCode: `class Solution {
public:
    int singleNumber(vector<int>& nums) {
        int ones = 0, twos = 0;
        for (int n : nums) { ones = (ones ^ n) & ~twos; twos = (twos ^ n) & ~ones; }
        return ones;
    }
};`,
},
  139: {
pythonCode: `class Solution:
    def wordBreak(self, s, wordDict):
        ws = set(wordDict)
        dp = [False] * (len(s)+1)
        dp[0] = True
        for i in range(1, len(s)+1):
            for j in range(i):
                if dp[j] and s[j:i] in ws: dp[i] = True; break
        return dp[len(s)]`,
typescriptCode: `class Solution {
  wordBreak(s: string, wordDict: string[]): boolean {
    const ws = new Set(wordDict);
    const dp = new Array(s.length + 1).fill(false);
    dp[0] = true;
    for (let i = 1; i <= s.length; i++)
      for (let j = 0; j < i; j++)
        if (dp[j] && ws.has(s.slice(j, i))) { dp[i] = true; break; }
    return dp[s.length];
  }
}`,
javaCode: `
class Solution {
    public boolean wordBreak(String s, List<String> wordDict) {
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;
        Set<String> words = new HashSet<>(wordDict);
        for (int i = 1; i <= s.length(); i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && words.contains(s.substring(j, i))) { dp[i] = true; break; }
            }
        }
        return dp[s.length()];
    }
}
`,
cppCode: `class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> words(wordDict.begin(), wordDict.end());
        vector<bool> dp(s.size()+1, false); dp[0] = true;
        for (int i = 1; i <= s.size(); i++)
            for (int j = 0; j < i; j++)
                if (dp[j] && words.count(s.substr(j, i-j))) { dp[i] = true; break; }
        return dp[s.size()];
    }
};`,
},
  141: {
pythonCode: `class Solution:
    def hasCycle(self, head):
        if not head: return False
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast: return True
        return False`,
typescriptCode: `class Solution {
  hasCycle(head: ListNode | null): boolean {
    if (!head) return false;
    let slow = head, fast = head;
    while (fast && fast.next) {
      slow = slow.next!; fast = fast.next.next;
      if (slow === fast) return true;
    }
    return false;
  }
}`,
javaCode: `
class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head, fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}
`,
cppCode: `class Solution {
public:
    bool hasCycle(ListNode* head) {
        ListNode *slow = head, *fast = head;
        while (fast && fast->next) { slow = slow->next; fast = fast->next->next;
            if (slow == fast) return true; }
        return false;
    }
};`,
},
  148: {
pythonCode: `class Solution:
    def sortList(self, head):
        if not head or not head.next: return head
        slow, fast = head, head.next
        while fast and fast.next: slow = slow.next; fast = fast.next.next
        mid = slow.next; slow.next = None
        left = self.sortList(head)
        right = self.sortList(mid)
        dummy = ListNode(0)
        curr = dummy
        while left and right:
            if left.val <= right.val: curr.next = left; left = left.next
            else: curr.next = right; right = right.next
            curr = curr.next
        curr.next = left or right
        return dummy.next`,
typescriptCode: `class Solution {
  sortList(head: ListNode | null): ListNode | null {
    if (!head || !head.next) return head;
    let slow = head, fast = head.next;
    while (fast && fast.next) { slow = slow.next!; fast = fast.next.next; }
    const mid = slow.next; slow.next = null;
    const left = this.sortList(head), right = this.sortList(mid);
    const dummy = new ListNode(0); let curr = dummy;
    let l: ListNode | null = left, r: ListNode | null = right;
    while (l && r) {
      if (l.val <= r.val) { curr.next = l; l = l.next; }
      else { curr.next = r; r = r.next; }
      curr = curr.next!;
    }
    curr.next = l || r;
    return dummy.next;
  }
}`,
javaCode: `
class Solution {
    public ListNode sortList(ListNode head) {
        if (head == null || head.next == null) return head;
        ListNode slow = head, fast = head.next;
        while (fast.next != null) { fast = fast.next.next; slow = slow.next; }
        ListNode mid = slow.next;
        slow.next = null;
        ListNode left = sortList(head), right = sortList(mid);
        return merge(left, right);
    }
    private ListNode merge(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0), curr = dummy;
        while (l1 != null && l2 != null) {
            if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }
            else { curr.next = l2; l2 = l2.next; }
            curr = curr.next;
        }
        curr.next = (l1 != null) ? l1 : l2;
        return dummy.next;
    }
}
`,
cppCode: `class Solution {
public:
    ListNode* sortList(ListNode* head) {
        if (!head || !head->next) return head;
        ListNode *slow = head, *fast = head->next;
        while (fast->next) { fast = fast->next->next; slow = slow->next; }
        ListNode* mid = slow->next; slow->next = nullptr;
        return merge(sortList(head), sortList(mid));
    }
    ListNode* merge(ListNode* l1, ListNode* l2) {
        ListNode dummy(0); ListNode* curr = &dummy;
        while (l1 && l2) {
            if (l1->val <= l2->val) { curr->next = l1; l1 = l1->next; }
            else { curr->next = l2; l2 = l2->next; }
            curr = curr->next;
        }
        curr->next = l1 ? l1 : l2; return dummy.next;
    }
};`,
},
  150: {
pythonCode: `class Solution:
    def evalRPN(self, tokens):
        stack = []
        for t in tokens:
            if t in '+-*/':
                b, a = stack.pop(), stack.pop()
                if t == '+': stack.append(a + b)
                elif t == '-': stack.append(a - b)
                elif t == '*': stack.append(a * b)
                else: stack.append(int(a / b))
            else: stack.append(int(t))
        return stack[0]`,
typescriptCode: `class Solution {
  evalRPN(tokens: string[]): number {
    const stack: number[] = [];
    for (const t of tokens) {
      if ('+-*/'.includes(t)) {
        const b = stack.pop()!, a = stack.pop()!;
        if (t === '+') stack.push(a + b);
        else if (t === '-') stack.push(a - b);
        else if (t === '*') stack.push(a * b);
        else stack.push(Math.trunc(a / b));
      } else stack.push(Number(t));
    }
    return stack[0];
  }
}`,
javaCode: `
class Solution {
    public int evalRPN(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String token : tokens) {
            switch (token) {
                case "+": stack.push(stack.pop() + stack.pop()); break;
                case "-": {
                    int b = stack.pop(), a = stack.pop();
                    stack.push(a - b); break;
                }
                case "*": stack.push(stack.pop() * stack.pop()); break;
                case "/": {
                    int b = stack.pop(), a = stack.pop();
                    stack.push(a / b); break;
                }
                default: stack.push(Integer.parseInt(token));
            }
        }
        return stack.pop();
    }
}
`,
cppCode: `
class Solution {
public:
    int evalRPN(vector<string>& tokens) {
        stack<int> st;
        for(auto&t:tokens){if(t=="+"||t=="-"||t=="*"||t=="/"){int b=st.top();st.pop();int a=st.top();st.pop();
            if(t=="+")st.push(a+b);else if(t=="-")st.push(a-b);else if(t=="*")st.push(a*b);else st.push(a/b);}
        else st.push(stoi(t));}
        return st.top();
    }
};`,
},
  151: {
pythonCode: `class Solution:
    def reverseWords(self, s):
        return ' '.join(s.split()[::-1])`,
typescriptCode: `class Solution {
  reverseWords(s: string): string {
    return s.trim().split(/\\s+/).reverse().join(' ');
  }
}`,
javaCode: `
class Solution {
    public String reverseWords(String s) {
        String[] words = s.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - 1; i >= 0; i--) {
            sb.append(words[i]);
            if (i > 0) sb.append(' ');
        }
        return sb.toString();
    }
}
`,
cppCode: `
class Solution {
public:
    string reverseWords(string s) {
        istringstream iss(s); vector<string> words; string w;
        while(iss>>w) words.push_back(w);
        reverse(words.begin(),words.end());
        string r; for(int i=0;i<words.size();i++){if(i)r+=' ';r+=words[i];}
        return r;
    }
};`,
},
  153: {
pythonCode: `class Solution:
    def findMin(self, nums):
        lo, hi = 0, len(nums)-1
        while lo < hi:
            mid = (lo+hi)//2
            if nums[mid] > nums[hi]: lo = mid+1
            else: hi = mid
        return nums[lo]`,
typescriptCode: `class Solution {
  findMin(nums: number[]): number {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (nums[mid] > nums[hi]) lo = mid + 1; else hi = mid;
    }
    return nums[lo];
  }
}`,
javaCode: `
class Solution {
    public int findMin(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] > nums[hi]) lo = mid + 1;
            else hi = mid;
        }
        return nums[lo];
    }
}
`,
cppCode: `class Solution {
public:
    int findMin(vector<int>& nums) {
        int lo = 0, hi = nums.size()-1;
        while (lo < hi) { int m = (lo+hi)/2;
            if (nums[m] > nums[hi]) lo = m+1; else hi = m; }
        return nums[lo];
    }
};`,
},
  162: {
pythonCode: `class Solution:
    def findPeakElement(self, nums):
        lo, hi = 0, len(nums) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if nums[mid] < nums[mid + 1]: lo = mid + 1
            else: hi = mid
        return lo`,
typescriptCode: `class Solution {
  findPeakElement(nums: number[]): number {
    let lo = 0, hi = nums.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (nums[mid] < nums[mid + 1]) lo = mid + 1; else hi = mid;
    }
    return lo;
  }
}`,
javaCode: `
class Solution {
    public int findPeakElement(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] < nums[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
`,
cppCode: `class Solution {
public:
    int findPeakElement(vector<int>& nums) {
        int lo = 0, hi = nums.size()-1;
        while (lo < hi) { int m = (lo+hi)/2;
            if (nums[m] < nums[m+1]) lo = m+1; else hi = m; }
        return lo;
    }
};`,
},
  167: {
pythonCode: `class Solution:
    def twoSum(self, numbers, target):
        left, right = 0, len(numbers) - 1
        while left < right:
            total = numbers[left] + numbers[right]
            if total == target: return [left + 1, right + 1]
            elif total < target: left += 1
            else: right -= 1
        return []`,
typescriptCode: `class Solution {
  twoSum(numbers: number[], target: number): number[] {
    let l = 0, r = numbers.length - 1;
    while (l < r) {
      const sum = numbers[l] + numbers[r];
      if (sum === target) return [l + 1, r + 1];
      else if (sum < target) l++; else r--;
    }
    return [];
  }
}`,
javaCode: `
class Solution {
    public int[] twoSum(int[] numbers, int target) {
        int left = 0, right = numbers.length - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) return new int[]{left + 1, right + 1};
            else if (sum < target) left++;
            else right--;
        }
        return new int[]{};
    }
}
`,
cppCode: `
class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {
        int l=0,r=numbers.size()-1;
        while(l<r){int s=numbers[l]+numbers[r];if(s==target)return{l+1,r+1};else if(s<l)l++;else r--;}
        return {};
    }
};`,
},
  169: {
pythonCode: `class Solution:
    def majorityElement(self, nums):
        candidate, count = nums[0], 1
        for i in range(1, len(nums)):
            if count == 0:
                candidate, count = nums[i], 1
            elif nums[i] == candidate:
                count += 1
            else:
                count -= 1
        return candidate`,
typescriptCode: `class Solution {
  majorityElement(nums: number[]): number {
    let candidate = nums[0], count = 1;
    for (let i = 1; i < nums.length; i++) {
      if (count === 0) { candidate = nums[i]; count = 1; }
      else if (nums[i] === candidate) count++;
      else count--;
    }
    return candidate;
  }
}`,
javaCode: `
class Solution {
    public int majorityElement(int[] nums) {
        int candidate = nums[0], count = 1;
        for (int i = 1; i < nums.length; i++) {
            if (count == 0) { candidate = nums[i]; count = 1; }
            else if (nums[i] == candidate) count++;
            else count--;
        }
        return candidate;
    }
}
`,
cppCode: `
class Solution {
public:
    int majorityElement(vector<int>& nums) {
        int candidate = nums[0], count = 1;
        for (int i = 1; i < nums.size(); i++) {
            if (count == 0) { candidate = nums[i]; count = 1; }
            else if (nums[i] == candidate) count++;
            else count--;
        }
        return candidate;
    }
};`,
},
  172: {
pythonCode: `class Solution:
    def trailingZeroes(self, n):
        count = 0
        while n >= 5: n //= 5; count += n
        return count`,
typescriptCode: `class Solution {
  trailingZeroes(n: number): number {
    let count = 0;
    while (n >= 5) { n = Math.floor(n / 5); count += n; }
    return count;
  }
}`,
javaCode: `
class Solution {
    public int trailingZeroes(int n) {
        int count = 0;
        while (n >= 5) { n /= 5; count += n; }
        return count;
    }
}
`,
cppCode: `class Solution {
public:
    int trailingZeroes(int n) {
        int count = 0;
        while (n >= 5) { n /= 5; count += n; }
        return count;
    }
};`,
},
  173: {
javaCode: `
class BSTIterator {
    private Deque<TreeNode> stack = new ArrayDeque<>();
    public BSTIterator(TreeNode root) {
        pushLeft(root);
    }
    public int next() {
        TreeNode node = stack.pop();
        pushLeft(node.right);
        return node.val;
    }
    public boolean hasNext() {
        return !stack.isEmpty();
    }
    private void pushLeft(TreeNode node) {
        while (node != null) { stack.push(node); node = node.left; }
    }
}
`,
cppCode: `class BSTIterator {
    stack<TreeNode*> st;
    void pushLeft(TreeNode* n) { while (n) { st.push(n); n = n->left; } }
public:
    BSTIterator(TreeNode* root) { pushLeft(root); }
    int next() { TreeNode* n = st.top(); st.pop(); pushLeft(n->right); return n->val; }
    bool hasNext() { return !st.empty(); }
};`,
},
  189: {
pythonCode: `class Solution:
    def rotate(self, nums, k):
        n = len(nums)
        k %= n
        nums[:] = nums[-k:] + nums[:-k]`,
typescriptCode: `class Solution {
  rotate(nums: number[], k: number): void {
    const n = nums.length; k %= n;
    const rotated = nums.slice(-k).concat(nums.slice(0, n - k));
    for (let i = 0; i < n; i++) nums[i] = rotated[i];
  }
}`,
javaCode: `
class Solution {
    public void rotate(int[] nums, int k) {
        int n = nums.length;
        k %= n;
        reverse(nums, 0, n - 1);
        reverse(nums, 0, k - 1);
        reverse(nums, k, n - 1);
    }
    private void reverse(int[] nums, int start, int end) {
        while (start < end) {
            int tmp = nums[start];
            nums[start++] = nums[end];
            nums[end--] = tmp;
        }
    }
}
`,
cppCode: `
class Solution {
public:
    void rotate(vector<int>& nums, int k) {
        int n = nums.size(); k %= n;
        reverse(nums.begin(), nums.end());
        reverse(nums.begin(), nums.begin() + k);
        reverse(nums.begin() + k, nums.end());
    }
};`,
},
  190: {
pythonCode: `class Solution:
    def reverseBits(self, n):
        result = 0
        for _ in range(32):
            result = result * 2 + (n & 1)
            n >>= 1
        return result`,
typescriptCode: `class Solution {
  reverseBits(n: number): number {
    let result = 0;
    for (let i = 0; i < 32; i++) { result = result * 2 + (n & 1); n >>>= 1; }
    return result >>> 0;
  }
}`,
javaCode: `
class Solution {
    public int reverseBits(int n) {
        int result = 0;
        for (int i = 0; i < 32; i++) {
            result = (result << 1) | (n & 1);
            n >>= 1;
        }
        return result;
    }
}
`,
cppCode: `class Solution {
public:
    uint32_t reverseBits(uint32_t n) {
        uint32_t result = 0;
        for (int i = 0; i < 32; i++) { result = (result << 1) | (n & 1); n >>= 1; }
        return result;
    }
};`,
},
  191: {
pythonCode: `class Solution:
    def hammingWeight(self, n):
        count = 0
        while n: n &= n - 1; count += 1
        return count`,
typescriptCode: `class Solution {
  hammingWeight(n: number): number {
    let count = 0;
    while (n) { n &= n - 1; count++; }
    return count;
  }
}`,
javaCode: `
class Solution {
    public int hammingWeight(int n) {
        int count = 0;
        while (n != 0) { n &= (n - 1); count++; }
        return count;
    }
}
`,
cppCode: `class Solution {
public:
    int hammingWeight(int n) {
        int count = 0;
        while (n) { n &= (n-1); count++; }
        return count;
    }
};`,
},
  198: {
pythonCode: `class Solution:
    def rob(self, nums):
        previous = 0
        current = 0
        for num in nums:
            previous, current = current, max(current, previous + num)
        return current`,
typescriptCode: `class Solution {
  rob(nums: number[]): number {
    let previous = 0;
    let current = 0;
    for (const num of nums) {
      const next = Math.max(current, previous + num);
      previous = current;
      current = next;
    }
    return current;
  }
}`,
javaCode: `
class Solution {
    public int rob(int[] nums) {
        if (nums.length == 1) return nums[0];
        int prev2 = 0, prev1 = 0;
        for (int num : nums) {
            int curr = Math.max(prev1, prev2 + num);
            prev2 = prev1;
            prev1 = curr;
        }
        return prev1;
    }
}
`,
cppCode: `class Solution {
public:
    int rob(vector<int>& nums) {
        int p2 = 0, p1 = 0;
        for (int n : nums) { int c = max(p1, p2+n); p2 = p1; p1 = c; }
        return p1;
    }
};`,
brutePythonCode: `class Solution:
    def rob(self, nums):
        def best(i):
            if i >= len(nums):
                return 0
            return max(nums[i] + best(i + 2), best(i + 1))
        return best(0)`,
bruteTypeScriptCode: `class Solution {
  rob(nums: number[]): number {
    const best = (i: number): number => {
      if (i >= nums.length) return 0;
      return Math.max(nums[i] + best(i + 2), best(i + 1));
    };
    return best(0);
  }
}`,
},
  199: {
pythonCode: `class Solution:
    def rightSideView(self, root):
        result = []
        if not root: return result
        from collections import deque
        queue = deque([root])
        while queue:
            level_size = len(queue)
            for i in range(level_size):
                node = queue.popleft()
                if i == level_size - 1: result.append(node.val)
                if node.left: queue.append(node.left)
                if node.right: queue.append(node.right)
        return result`,
typescriptCode: `class Solution {
  rightSideView(root: TreeNode | null): number[] {
    const r: number[] = []; if (!root) return r;
    const q: any[] = [root];
    while (q.length) {
      const sz = q.length;
      for (let i = 0; i < sz; i++) {
        const n = q.shift();
        if (i === sz - 1) r.push(n.val);
        if (n.left) q.push(n.left); if (n.right) q.push(n.right);
      }
    }
    return r;
  }
}`,
javaCode: `
class Solution {
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                if (i == size - 1) result.add(node.val);
                if (node.left != null) queue.add(node.left);
                if (node.right != null) queue.add(node.right);
            }
        }
        return result;
    }
}
`,
cppCode: `class Solution {
public:
    vector<int> rightSideView(TreeNode* root) {
        vector<int> r; if (!root) return r;
        queue<TreeNode*> q; q.push(root);
        while (!q.empty()) {
            int sz = q.size();
            for (int i = 0; i < sz; i++) {
                TreeNode* n = q.front(); q.pop();
                if (i == sz - 1) r.push_back(n->val);
                if (n->left) q.push(n->left);
                if (n->right) q.push(n->right);
            }
        }
        return r;
    }
};`,
},
  200: {
pythonCode: `class Solution:
    def numIslands(self, grid):
        rows = len(grid)
        cols = len(grid[0]) if rows else 0
        count = 0
        def sink(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] == "0":
                return
            grid[r][c] = "0"
            sink(r + 1, c)
            sink(r - 1, c)
            sink(r, c + 1)
            sink(r, c - 1)
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":
                    count += 1
                    sink(r, c)
        return count`,
typescriptCode: `class Solution {
  numIslands(grid: string[][]): number {
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 0;
    let count = 0;
    const sink = (r: number, c: number) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === "0") return;
      grid[r][c] = "0";
      sink(r + 1, c);
      sink(r - 1, c);
      sink(r, c + 1);
      sink(r, c - 1);
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === "1") {
          count++;
          sink(r, c);
        }
      }
    }
    return count;
  }
}`,
javaCode: `
class Solution {
    public int numIslands(char[][] grid) {
        int count = 0;
        for (int i = 0; i < grid.length; i++)
            for (int j = 0; j < grid[0].length; j++)
                if (grid[i][j] == '1') { dfs(grid, i, j); count++; }
        return count;
    }
    private void dfs(char[][] grid, int r, int c) {
        if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] == '0') return;
        grid[r][c] = '0';
        dfs(grid, r + 1, c); dfs(grid, r - 1, c);
        dfs(grid, r, c + 1); dfs(grid, r, c - 1);
    }
}
`,
cppCode: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        int count = 0;
        for (int i = 0; i < grid.size(); i++)
            for (int j = 0; j < grid[0].size(); j++)
                if (grid[i][j] == '1') { dfs(grid, i, j); count++; }
        return count;
    }
    void dfs(vector<vector<char>>& g, int r, int c) {
        if (r < 0 || c < 0 || r >= g.size() || c >= g[0].size() || g[r][c] != '1') return;
        g[r][c] = '0';
        dfs(g,r+1,c); dfs(g,r-1,c); dfs(g,r,c+1); dfs(g,r,c-1);
    }
};`,
},
  201: {
pythonCode: `class Solution:
    def rangeBitwiseAnd(self, left, right):
        shift = 0
        while left < right: left >>= 1; right >>= 1; shift += 1
        return left << shift`,
typescriptCode: `class Solution {
  rangeBitwiseAnd(left: number, right: number): number {
    let shift = 0;
    while (left < right) { left >>= 1; right >>= 1; shift++; }
    return left << shift;
  }
}`,
javaCode: `
class Solution {
    public int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) { left >>= 1; right >>= 1; shift++; }
        return left << shift;
    }
}
`,
cppCode: `class Solution {
public:
    int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) { left >>= 1; right >>= 1; shift++; }
        return left << shift;
    }
};`,
},
  202: {
pythonCode: `class Solution:
    def isHappy(self, n):
        seen = set()
        while n != 1 and n not in seen:
            seen.add(n)
            n = sum(int(d)**2 for d in str(n))
        return n == 1`,
typescriptCode: `class Solution {
  isHappy(n: number): boolean {
    const seen = new Set<number>();
    while (n !== 1 && !seen.has(n)) {
      seen.add(n);
      let sum = 0;
      while (n > 0) { sum += (n % 10) ** 2; n = Math.floor(n / 10); }
      n = sum;
    }
    return n === 1;
  }
}`,
javaCode: `
class Solution {
    public boolean isHappy(int n) {
        Set<Integer> seen = new HashSet<>();
        while (n != 1 && !seen.contains(n)) {
            seen.add(n);
            int sum = 0;
            while (n > 0) { sum += (n % 10) * (n % 10); n /= 10; }
            n = sum;
        }
        return n == 1;
    }
}
`,
cppCode: `
class Solution {
public:
    bool isHappy(int n) {
        unordered_set<int> seen;
        while(n!=1&&!seen.count(n)){seen.insert(n);int s=0;while(n){s+=(n%10)*(n%10);n/=10;}n=s;}
        return n==1;
    }
};`,
},
  205: {
pythonCode: `class Solution:
    def isIsomorphic(self, s, t):
        if len(s) != len(t): return False
        s2t, t2s = {}, {}
        for sc, tc in zip(s, t):
            if sc in s2t and s2t[sc] != tc: return False
            if tc in t2s and t2s[tc] != sc: return False
            s2t[sc] = tc
            t2s[tc] = sc
        return True`,
typescriptCode: `class Solution {
  isIsomorphic(s: string, t: string): boolean {
    if (s.length !== t.length) return false;
    const s2t: Record<string,string> = {}, t2s: Record<string,string> = {};
    for (let i = 0; i < s.length; i++) {
      if (s2t[s[i]] && s2t[s[i]] !== t[i]) return false;
      if (t2s[t[i]] && t2s[t[i]] !== s[i]) return false;
      s2t[s[i]] = t[i]; t2s[t[i]] = s[i];
    }
    return true;
  }
}`,
javaCode: `
class Solution {
    public boolean isIsomorphic(String s, String t) {
        if (s.length() != t.length()) return false;
        Map<Character, Character> sToT = new HashMap<>();
        Map<Character, Character> tToS = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char sc = s.charAt(i), tc = t.charAt(i);
            if (sToT.containsKey(sc) && sToT.get(sc) != tc) return false;
            if (tToS.containsKey(tc) && tToS.get(tc) != sc) return false;
            sToT.put(sc, tc);
            tToS.put(tc, sc);
        }
        return true;
    }
}
`,
cppCode: `
class Solution {
public:
    bool isIsomorphic(string s, string t) {
        if(s.size()!=t.size())return false;
        unordered_map<char,char> s2t,t2s;
        for(int i=0;i<s.size();i++){
            if(s2t.count(s[i])&&s2t[s[i]]!=t[i])return false;
            if(t2s.count(t[i])&&t2s[t[i]]!=s[i])return false;
            s2t[s[i]]=t[i];t2s[t[i]]=s[i];
        }
        return true;
    }
};`,
},
  207: {
pythonCode: `class Solution:
    def canFinish(self, numCourses, prerequisites):
        graph = {i: [] for i in range(numCourses)}
        for a, b in prerequisites:
            graph[a].append(b)
        visited = [0] * numCourses
        def dfs(node):
            if visited[node] == 1: return False
            if visited[node] == 2: return True
            visited[node] = 1
            for nb in graph[node]:
                if not dfs(nb): return False
            visited[node] = 2
            return True
        return all(dfs(i) for i in range(numCourses))`,
typescriptCode: `class Solution {
  canFinish(numCourses: number, prerequisites: number[][]): boolean {
    const graph: number[][] = Array.from({ length: numCourses }, () => []);
    for (const [a, b] of prerequisites) graph[a].push(b);
    const visited = new Array(numCourses).fill(0);
    const dfs = (node: number): boolean => {
      if (visited[node] === 1) return false;
      if (visited[node] === 2) return true;
      visited[node] = 1;
      for (const nb of graph[node]) if (!dfs(nb)) return false;
      visited[node] = 2;
      return true;
    };
    for (let i = 0; i < numCourses; i++) if (!dfs(i)) return false;
    return true;
  }
}`,
javaCode: `
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        int[] inDegree = new int[numCourses];
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        for (int[] pre : prerequisites) { graph.get(pre[1]).add(pre[0]); inDegree[pre[0]]++; }
        Queue<Integer> queue = new LinkedList<>();
        for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) queue.add(i);
        int count = 0;
        while (!queue.isEmpty()) {
            int course = queue.poll();
            count++;
            for (int next : graph.get(course)) {
                if (--inDegree[next] == 0) queue.add(next);
            }
        }
        return count == numCourses;
    }
}
`,
cppCode: `class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prereqs) {
        vector<vector<int>> g(numCourses); vector<int> indeg(numCourses);
        for (auto& p : prereqs) { g[p[1]].push_back(p[0]); indeg[p[0]]++; }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        int count = 0;
        while (!q.empty()) { int c = q.front(); q.pop(); count++;
            for (int n : g[c]) if (--indeg[n] == 0) q.push(n); }
        return count == numCourses;
    }
};`,
},
  209: {
pythonCode: `class Solution:
    def minSubArrayLen(self, target, nums):
        left = total = 0
        min_len = float('inf')
        for right in range(len(nums)):
            total += nums[right]
            while total >= target:
                min_len = min(min_len, right - left + 1)
                total -= nums[left]
                left += 1
        return 0 if min_len == float('inf') else min_len`,
typescriptCode: `class Solution {
  minSubArrayLen(target: number, nums: number[]): number {
    let l = 0, sum = 0, minLen = Infinity;
    for (let r = 0; r < nums.length; r++) {
      sum += nums[r];
      while (sum >= target) { minLen = Math.min(minLen, r - l + 1); sum -= nums[l++]; }
    }
    return minLen === Infinity ? 0 : minLen;
  }
}`,
javaCode: `
class Solution {
    public int minSubArrayLen(int target, int[] nums) {
        int left = 0, sum = 0, minLen = Integer.MAX_VALUE;
        for (int right = 0; right < nums.length; right++) {
            sum += nums[right];
            while (sum >= target) {
                minLen = Math.min(minLen, right - left + 1);
                sum -= nums[left++];
            }
        }
        return minLen == Integer.MAX_VALUE ? 0 : minLen;
    }
}
`,
cppCode: `
class Solution {
public:
    int minSubArrayLen(int target, vector<int>& nums) {
        int l=0,sum=0,minLen=INT_MAX;
        for(int r=0;r<nums.size();r++){sum+=nums[r];while(sum>=target){minLen=min(minLen,r-l+1);sum-=nums[l++];}}
        return minLen==INT_MAX?0:minLen;
    }
};`,
},
  210: {
pythonCode: `class Solution:
    def findOrder(self, numCourses, prerequisites):
        graph = {i: [] for i in range(numCourses)}
        indegree = [0] * numCourses
        for a, b in prerequisites:
            graph[b].append(a)
            indegree[a] += 1
        from collections import deque
        queue = deque([i for i in range(numCourses) if indegree[i] == 0])
        order = []
        while queue:
            node = queue.popleft()
            order.append(node)
            for nb in graph[node]:
                indegree[nb] -= 1
                if indegree[nb] == 0: queue.append(nb)
        return order if len(order) == numCourses else []`,
typescriptCode: `class Solution {
  findOrder(numCourses: number, prerequisites: number[][]): number[] {
    const graph: number[][] = Array.from({ length: numCourses }, () => []);
    const indegree = new Array(numCourses).fill(0);
    for (const [a, b] of prerequisites) { graph[b].push(a); indegree[a]++; }
    const queue: number[] = [];
    for (let i = 0; i < numCourses; i++) if (indegree[i] === 0) queue.push(i);
    const order: number[] = [];
    while (queue.length) {
      const node = queue.shift()!;
      order.push(node);
      for (const nb of graph[node]) if (--indegree[nb] === 0) queue.push(nb);
    }
    return order.length === numCourses ? order : [];
  }
}`,
javaCode: `
class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> graph = new ArrayList<>();
        int[] inDegree = new int[numCourses];
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        for (int[] pre : prerequisites) { graph.get(pre[1]).add(pre[0]); inDegree[pre[0]]++; }
        Queue<Integer> queue = new LinkedList<>();
        for (int i = 0; i < numCourses; i++) if (inDegree[i] == 0) queue.add(i);
        int[] order = new int[numCourses];
        int idx = 0;
        while (!queue.isEmpty()) {
            int course = queue.poll();
            order[idx++] = course;
            for (int next : graph.get(course)) {
                if (--inDegree[next] == 0) queue.add(next);
            }
        }
        return idx == numCourses ? order : new int[]{};
    }
}
`,
cppCode: `class Solution {
public:
    vector<int> findOrder(int numCourses, vector<vector<int>>& prereqs) {
        vector<vector<int>> g(numCourses); vector<int> indeg(numCourses);
        for (auto& p : prereqs) { g[p[1]].push_back(p[0]); indeg[p[0]]++; }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) if (indeg[i] == 0) q.push(i);
        vector<int> order;
        while (!q.empty()) { int c = q.front(); q.pop(); order.push_back(c);
            for (int n : g[c]) if (--indeg[n] == 0) q.push(n); }
        return order.size() == numCourses ? order : vector<int>{};
    }
};`,
},
  212: {
pythonCode: `class Solution:
    def findWords(self, board, words):
        trie = {}
        for word in words:
            node = trie
            for ch in word: node = node.setdefault(ch, {})
            node['#'] = word
        result = []
        rows, cols = len(board), len(board[0])
        def dfs(r, c, node):
            if '#' in node: result.append(node.pop('#'))
            if r<0 or r>=rows or c<0 or c>=cols or board[r][c] not in node: return
            ch = board[r][c]; board[r][c] = '#'
            for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]: dfs(r+dr,c+dc,node[ch])
            board[r][c] = ch
            if not node[ch]: del node[ch]
        for r in range(rows):
            for c in range(cols): dfs(r, c, trie)
        return result`,
typescriptCode: `class Solution {
  findWords(board: string[][], words: string[]): string[] {
    const trie: Record<string, any> = {};
    for (const word of words) { let node = trie;
      for (const ch of word) node = node[ch] = node[ch] || {};
      node.word = word; }
    const result: string[] = [];
    const rows = board.length, cols = board[0].length;
    const dfs = (r: number, c: number, node: Record<string, any>): void => {
      if (r<0||r>=rows||c<0||c>=cols||!(board[r][c] in node)) return;
      const ch = board[r][c];
      if (ch === '#' || !node[ch]) return;
      const child = node[ch];
      if (child.word) { result.push(child.word); delete child.word; }
      board[r][c] = '#';
      dfs(r+1,c,child); dfs(r-1,c,child); dfs(r,c+1,child); dfs(r,c-1,child);
      board[r][c] = ch;
      if (!Object.keys(child).length) delete node[ch];
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dfs(r, c, trie);
    return result;
  }
}`,
javaCode: `
class Solution {
    public List<String> findWords(char[][] board, String[] words) {
        List<String> result = new ArrayList<>();
        TrieNode root = buildTrie(words);
        for (int i = 0; i < board.length; i++)
            for (int j = 0; j < board[0].length; j++)
                dfs(board, i, j, root, result);
        return result;
    }
    private void dfs(char[][] board, int r, int c, TrieNode node, List<String> result) {
        if (r < 0 || c < 0 || r >= board.length || c >= board[0].length) return;
        char ch = board[r][c];
        if (ch == '#' || node.children[ch - 'a'] == null) return;
        node = node.children[ch - 'a'];
        if (node.word != null) { result.add(node.word); node.word = null; }
        board[r][c] = '#';
        dfs(board, r+1, c, node, result);
        dfs(board, r-1, c, node, result);
        dfs(board, r, c+1, node, result);
        dfs(board, r, c-1, node, result);
        board[r][c] = ch;
    }
    private TrieNode buildTrie(String[] words) {
        TrieNode root = new TrieNode();
        for (String word : words) {
            TrieNode node = root;
            for (char ch : word.toCharArray()) {
                if (node.children[ch - 'a'] == null) node.children[ch - 'a'] = new TrieNode();
                node = node.children[ch - 'a'];
            }
            node.word = word;
        }
        return root;
    }
    class TrieNode { TrieNode[] children = new TrieNode[26]; String word; }
}
`,
cppCode: `class Solution {
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        vector<string> result;
        struct TrieNode { TrieNode* children[26] = {}; string word; };
        TrieNode root;
        for (auto& w : words) {
            TrieNode* node = &root;
            for (char c : w) { int i = c-'a'; if (!node->children[i]) node->children[i] = new TrieNode(); node = node->children[i]; }
            node->word = w;
        }
        function<void(int,int,TrieNode*)> dfs = [&](int r, int c, TrieNode* node) {
            if (r<0||c<0||r>=board.size()||c>=board[0].size()) return;
            char ch = board[r][c];
            if (ch=='#'||!node->children[ch-'a']) return;
            node = node->children[ch-'a'];
            if (!node->word.empty()) { result.push_back(node->word); node->word.clear(); }
            board[r][c] = '#';
            dfs(r+1,c,node); dfs(r-1,c,node); dfs(r,c+1,node); dfs(r,c-1,node);
            board[r][c] = ch;
        };
        for (int i = 0; i < board.size(); i++)
            for (int j = 0; j < board[0].size(); j++) dfs(i, j, &root);
        return result;
    }
};`,
},
  215: {
pythonCode: `class Solution:
    def findKthLargest(self, nums, k):
        import heapq
        return heapq.nlargest(k, nums)[-1]`,
typescriptCode: `class Solution {
  findKthLargest(nums: number[], k: number): number {
    const quickSelect = (left: number, right: number): number => {
      const pivot = nums[right];
      let store = left;
      for (let i = left; i < right; i++) {
        if (nums[i] > pivot) {
          const temp = nums[i];
          nums[i] = nums[store];
          nums[store] = temp;
          store++;
        }
      }
      nums[right] = nums[store];
      nums[store] = pivot;
      if (store === k - 1) return nums[store];
      return store > k - 1 ? quickSelect(left, store - 1) : quickSelect(store + 1, right);
    };
    return quickSelect(0, nums.length - 1);
  }
}`,
javaCode: `
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int num : nums) {
            minHeap.add(num);
            if (minHeap.size() > k) minHeap.poll();
        }
        return minHeap.peek();
    }
}
`,
cppCode: `class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> pq;
        for (int n : nums) { pq.push(n); if (pq.size() > k) pq.pop(); }
        return pq.top();
    }
};`,
brutePythonCode: `class Solution:
    def findKthLargest(self, nums, k):
        nums.sort(reverse=True)
        return nums[k - 1]`,
bruteTypeScriptCode: `class Solution {
  findKthLargest(nums: number[], k: number): number {
    nums.sort((a, b) => b - a);
    return nums[k - 1];
  }
}`,
},
  219: {
pythonCode: `class Solution:
    def containsNearbyDuplicate(self, nums, k):
        window = set()
        for i, num in enumerate(nums):
            if i > k: window.discard(nums[i - k - 1])
            if num in window: return True
            window.add(num)
        return False`,
typescriptCode: `class Solution {
  containsNearbyDuplicate(nums: number[], k: number): boolean {
    const window = new Set<number>();
    for (let i = 0; i < nums.length; i++) {
      if (i > k) window.delete(nums[i - k - 1]);
      if (window.has(nums[i])) return true;
      window.add(nums[i]);
    }
    return false;
  }
}`,
javaCode: `
class Solution {
    public boolean containsNearbyDuplicate(int[] nums, int k) {
        Set<Integer> window = new HashSet<>();
        for (int i = 0; i < nums.length; i++) {
            if (i > k) window.remove(nums[i - k - 1]);
            if (!window.add(nums[i])) return true;
        }
        return false;
    }
}
`,
cppCode: `
class Solution {
public:
    bool containsNearbyDuplicate(vector<int>& nums, int k) {
        unordered_set<int> window;
        for(int i=0;i<nums.size();i++){if(i>k)window.erase(nums[i-k-1]);if(!window.insert(nums[i]).second)return true;}
        return false;
    }
};`,
},
  221: {
pythonCode: `class Solution:
    def maximalSquare(self, matrix):
        rows, cols = len(matrix), len(matrix[0])
        dp = [[0]*(cols+1) for _ in range(rows+1)]
        mx = 0
        for r in range(1, rows+1):
            for c in range(1, cols+1):
                if matrix[r-1][c-1] == '1':
                    dp[r][c] = min(dp[r-1][c], dp[r][c-1], dp[r-1][c-1]) + 1
                    mx = max(mx, dp[r][c])
        return mx * mx`,
typescriptCode: `class Solution {
  maximalSquare(matrix: string[][]): number {
    const rows = matrix.length, cols = matrix[0].length;
    const dp = Array.from({length: rows+1}, () => new Array(cols+1).fill(0));
    let mx = 0;
    for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++)
      if (matrix[r-1][c-1] === '1') {
        dp[r][c] = Math.min(dp[r-1][c], dp[r][c-1], dp[r-1][c-1]) + 1;
        mx = Math.max(mx, dp[r][c]);
      }
    return mx * mx;
  }
}`,
javaCode: `
class Solution {
    public int maximalSquare(char[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[] dp = new int[n + 1];
        int maxSide = 0;
        for (int i = 1; i <= m; i++) {
            int prev = 0;
            for (int j = 1; j <= n; j++) {
                int temp = dp[j];
                if (matrix[i - 1][j - 1] == '1') dp[j] = 1 + Math.min(prev, Math.min(dp[j], dp[j - 1]));
                else dp[j] = 0;
                maxSide = Math.max(maxSide, dp[j]);
                prev = temp;
            }
        }
        return maxSide * maxSide;
    }
}
`,
cppCode: `class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {
        int m = matrix.size(), n = matrix[0].size(), maxSide = 0;
        vector<int> dp(n+1, 0);
        for (int i = 1; i <= m; i++) {
            int prev = 0;
            for (int j = 1; j <= n; j++) {
                int tmp = dp[j];
                if (matrix[i-1][j-1] == '1') dp[j] = 1 + min({prev, dp[j], dp[j-1]});
                else dp[j] = 0;
                maxSide = max(maxSide, dp[j]);
                prev = tmp;
            }
        }
        return maxSide * maxSide;
    }
};`,
},
  222: {
pythonCode: `class Solution:
    def countNodes(self, root):
        if not root:
            return 0
        def height(node):
            h = 0
            while node:
                h += 1
                node = node.left
            return h
        left_h = height(root.left)
        right_h = height(root.right)
        if left_h == right_h:
            return (1 << left_h) + self.countNodes(root.right)
        return (1 << right_h) + self.countNodes(root.left)`,
typescriptCode: `class Solution {
  countNodes(root: TreeNode | null): number {
    if (!root) return 0;
    const height = (node: TreeNode | null): number => {
      let h = 0;
      while (node) { h++; node = node.left; }
      return h;
    };
    const leftH = height(root.left), rightH = height(root.right);
    if (leftH === rightH) return (1 << leftH) + this.countNodes(root.right);
    return (1 << rightH) + this.countNodes(root.left);
  }
}`,
javaCode: `
class Solution {
    public int countNodes(TreeNode root) {
        if (root == null) return 0;
        int left = getDepth(root.left), right = getDepth(root.right);
        if (left == right) return (1 << left) + countNodes(root.right);
        return (1 << right) + countNodes(root.left);
    }
    private int getDepth(TreeNode node) {
        int d = 0;
        while (node != null) { d++; node = node.left; }
        return d;
    }
}
`,
cppCode: `class Solution {
public:
    int countNodes(TreeNode* root) {
        if (!root) return 0;
        int l = depth(root->left), r = depth(root->right);
        if (l == r) return (1 << l) + countNodes(root->right);
        return (1 << r) + countNodes(root->left);
    }
    int depth(TreeNode* n) { int d = 0; while (n) { d++; n = n->left; } return d; }
};`,
},
  226: {
pythonCode: `class Solution:
    def invertTree(self, root):
        if root is None:
            return None
        root.left, root.right = root.right, root.left
        self.invertTree(root.left)
        self.invertTree(root.right)
        return root`,
typescriptCode: `class Solution {
  invertTree(root: TreeNode | null): TreeNode | null {
    if (root === null) return null;
    const temp = root.left;
    root.left = root.right;
    root.right = temp;
    this.invertTree(root.left);
    this.invertTree(root.right);
    return root;
  }
}`,
javaCode: `
class Solution {
    public TreeNode invertTree(TreeNode root) {
        if (root == null) return null;
        TreeNode tmp = root.left;
        root.left = invertTree(root.right);
        root.right = invertTree(tmp);
        return root;
    }
}
`,
cppCode: `class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        swap(root->left, root->right);
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};`,
},
  228: {
pythonCode: `class Solution:
    def summaryRanges(self, nums):
        result = []
        i = 0
        while i < len(nums):
            start = nums[i]
            while i + 1 < len(nums) and nums[i + 1] == nums[i] + 1: i += 1
            if nums[i] == start: result.append(str(start))
            else: result.append(f'{start}->{nums[i]}')
            i += 1
        return result`,
typescriptCode: `class Solution {
  summaryRanges(nums: number[]): string[] {
    const r: string[] = []; let i = 0;
    while (i < nums.length) {
      const start = nums[i];
      while (i + 1 < nums.length && nums[i + 1] === nums[i] + 1) i++;
      r.push(nums[i] === start ? \`\${start}\` : \`\${start}->\${nums[i]}\`);
      i++;
    }
    return r;
  }
}`,
javaCode: `
class Solution {
    public List<String> summaryRanges(int[] nums) {
        List<String> result = new ArrayList<>();
        int i = 0;
        while (i < nums.length) {
            int start = nums[i];
            while (i + 1 < nums.length && nums[i + 1] == nums[i] + 1) i++;
            if (nums[i] == start) result.add(String.valueOf(start));
            else result.add(start + "->" + nums[i]);
            i++;
        }
        return result;
    }
}
`,
cppCode: `
class Solution {
public:
    vector<string> summaryRanges(vector<int>& nums) {
        vector<string> r; int i=0;
        while(i<nums.size()){int start=nums[i];while(i+1<nums.size()&&nums[i+1]==nums[i]+1)i++;
            if(nums[i]==start)r.push_back(to_string(start));else r.push_back(to_string(start)+"->"+to_string(nums[i]));i++;}
        return r;
    }
};`,
},
  230: {
pythonCode: `class Solution:
    def kthSmallest(self, root, k):
        self.count = 0
        self.result = None
        def walk(node):
            if not node or self.result is not None:
                return
            walk(node.left)
            self.count += 1
            if self.count == k:
                self.result = node.val
                return
            walk(node.right)
        walk(root)
        return self.result`,
typescriptCode: `class Solution {
  count = 0;
  result: number | null = null;
  kthSmallest(root: TreeNode | null, k: number): number {
    this.count = 0;
    this.result = null;
    this.walk(root, k);
    return this.result!;
  }
  walk(node: TreeNode | null, k: number): void {
    if (!node || this.result !== null) return;
    this.walk(node.left, k);
    this.count++;
    if (this.count === k) { this.result = node.val; return; }
    this.walk(node.right, k);
  }
}`,
javaCode: `
class Solution {
    public int kthSmallest(TreeNode root, int k) {
        int[] count = {0};
        int[] result = {0};
        inorder(root, k, count, result);
        return result[0];
    }
    private void inorder(TreeNode node, int k, int[] count, int[] result) {
        if (node == null) return;
        inorder(node.left, k, count, result);
        count[0]++;
        if (count[0] == k) { result[0] = node.val; return; }
        inorder(node.right, k, count, result);
    }
}
`,
cppCode: `class Solution {
public:
    int kthSmallest(TreeNode* root, int k) {
        int count = 0, result = 0;
        function<void(TreeNode*)> inorder = [&](TreeNode* n) {
            if (!n || count >= k) return;
            inorder(n->left);
            if (++count == k) { result = n->val; return; }
            inorder(n->right);
        };
        inorder(root); return result;
    }
};`,
},
  236: {
pythonCode: `class Solution:
    def lowestCommonAncestor(self, root, p, q):
        def dfs(node):
            if not node or node == p or node == q:
                return node
            left = dfs(node.left)
            right = dfs(node.right)
            if left and right:
                return node
            return left or right
        return dfs(root)`,
typescriptCode: `class Solution {
  lowestCommonAncestor(root: TreeNode | null, p: number, q: number): TreeNode | null {
    if (!root || root.val === p || root.val === q) return root;
    const left = this.lowestCommonAncestor(root.left, p, q);
    const right = this.lowestCommonAncestor(root.right, p, q);
    if (left && right) return root;
    return left || right;
  }
}`,
javaCode: `
class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) return root;
        return left != null ? left : right;
    }
}
`,
cppCode: `class Solution {
public:
    TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
        if (!root || root == p || root == q) return root;
        TreeNode* left = lowestCommonAncestor(root->left, p, q);
        TreeNode* right = lowestCommonAncestor(root->right, p, q);
        if (left && right) return root;
        return left ? left : right;
    }
};`,
},
  238: {
pythonCode: `class Solution:
    def productExceptSelf(self, nums):
        n = len(nums)
        result = [1] * n
        prefix = 1
        for i in range(n):
            result[i] = prefix
            prefix *= nums[i]
        suffix = 1
        for i in range(n - 1, -1, -1):
            result[i] *= suffix
            suffix *= nums[i]
        return result`,
typescriptCode: `class Solution {
  productExceptSelf(nums: number[]): number[] {
    const n = nums.length, result = new Array(n).fill(1);
    let prefix = 1;
    for (let i = 0; i < n; i++) { result[i] = prefix; prefix *= nums[i]; }
    let suffix = 1;
    for (let i = n - 1; i >= 0; i--) { result[i] *= suffix; suffix *= nums[i]; }
    return result;
  }
}`,
javaCode: `
class Solution {
    public int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        Arrays.fill(result, 1);
        int prefix = 1;
        for (int i = 0; i < n; i++) {
            result[i] = prefix;
            prefix *= nums[i];
        }
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            result[i] *= suffix;
            suffix *= nums[i];
        }
        return result;
    }
}
`,
cppCode: `
class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size(); vector<int> result(n, 1);
        int prefix = 1;
        for (int i = 0; i < n; i++) { result[i] = prefix; prefix *= nums[i]; }
        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) { result[i] *= suffix; suffix *= nums[i]; }
        return result;
    }
};`,
},
  242: {
pythonCode: `class Solution:
    def isAnagram(self, s, t):
        if len(s) != len(t): return False
        from collections import Counter
        return Counter(s) == Counter(t)`,
typescriptCode: `class Solution {
  isAnagram(s: string, t: string): boolean {
    if (s.length !== t.length) return false;
    const count = new Array(26).fill(0);
    for (let i = 0; i < s.length; i++) { count[s.charCodeAt(i)-97]++; count[t.charCodeAt(i)-97]--; }
    return count.every(c => c === 0);
  }
}`,
javaCode: `
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) if (c != 0) return false;
        return true;
    }
}
`,
cppCode: `
class Solution {
public:
    bool isAnagram(string s, string t) {
        if(s.size()!=t.size())return false;
        int count[26]={};
        for(int i=0;i<s.size();i++){count[s[i]-'a']++;count[t[i]-'a']--;}
        for(int c:count)if(c)return false;
        return true;
    }
};`,
},
  274: {
pythonCode: `class Solution:
    def hIndex(self, citations):
        citations.sort(reverse=True)
        for i, c in enumerate(citations):
            if c < i + 1: return i
        return len(citations)`,
typescriptCode: `class Solution {
  hIndex(citations: number[]): number {
    citations.sort((a, b) => b - a);
    for (let i = 0; i < citations.length; i++)
      if (citations[i] < i + 1) return i;
    return citations.length;
  }
}`,
javaCode: `
class Solution {
    public int hIndex(int[] citations) {
        Arrays.sort(citations);
        int n = citations.length;
        for (int i = 0; i < n; i++) {
            if (citations[n - 1 - i] < i + 1) return i;
        }
        return n;
    }
}
`,
cppCode: `
class Solution {
public:
    int hIndex(vector<int>& citations) {
        sort(citations.rbegin(), citations.rend());
        for (int i = 0; i < citations.size(); i++)
            if (citations[i] < i + 1) return i;
        return citations.size();
    }
};`,
},
  290: {
pythonCode: `class Solution:
    def wordPattern(self, pattern, s):
        words = s.split()
        if len(pattern) != len(words): return False
        c2w, w2c = {}, {}
        for c, w in zip(pattern, words):
            if c in c2w and c2w[c] != w: return False
            if w in w2c and w2c[w] != c: return False
            c2w[c] = w
            w2c[w] = c
        return True`,
typescriptCode: `class Solution {
  wordPattern(pattern: string, s: string): boolean {
    const words = s.split(' ');
    if (pattern.length !== words.length) return false;
    const c2w: Record<string,string> = {}, w2c: Record<string,string> = {};
    for (let i = 0; i < pattern.length; i++) {
      if (c2w[pattern[i]] && c2w[pattern[i]] !== words[i]) return false;
      if (w2c[words[i]] && w2c[words[i]] !== pattern[i]) return false;
      c2w[pattern[i]] = words[i]; w2c[words[i]] = pattern[i];
    }
    return true;
  }
}`,
javaCode: `
class Solution {
    public boolean wordPattern(String pattern, String s) {
        String[] words = s.split(" ");
        if (pattern.length() != words.length) return false;
        Map<Character, String> cToW = new HashMap<>();
        Map<String, Character> wToC = new HashMap<>();
        for (int i = 0; i < pattern.length(); i++) {
            char c = pattern.charAt(i);
            String w = words[i];
            if (cToW.containsKey(c) && !cToW.get(c).equals(w)) return false;
            if (wToC.containsKey(w) && wToC.get(w) != c) return false;
            cToW.put(c, w);
            wToC.put(w, c);
        }
        return true;
    }
}
`,
cppCode: `
class Solution {
public:
    bool wordPattern(string pattern, string s) {
        istringstream iss(s); vector<string> words; string w;
        while(iss>>w)words.push_back(w);
        if(pattern.size()!=words.size())return false;
        unordered_map<char,string> c2w; unordered_map<string,char> w2c;
        for(int i=0;i<pattern.size();i++){
            if(c2w.count(pattern[i])&&c2w[pattern[i]]!=words[i])return false;
            if(w2c.count(words[i])&&w2c[words[i]]!=pattern[i])return false;
            c2w[pattern[i]]=words[i];w2c[words[i]]=pattern[i];
        }
        return true;
    }
};`,
},
  300: {
pythonCode: `class Solution:
    def lengthOfLIS(self, nums):
        tails = []
        for num in nums:
            lo, hi = 0, len(tails)
            while lo < hi:
                mid = (lo+hi)//2
                if tails[mid] < num: lo = mid+1
                else: hi = mid
            if lo == len(tails): tails.append(num)
            else: tails[lo] = num
        return len(tails)`,
typescriptCode: `class Solution {
  lengthOfLIS(nums: number[]): number {
    const tails: number[] = [];
    for (const num of nums) {
      let lo = 0, hi = tails.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (tails[mid] < num) lo = mid + 1; else hi = mid;
      }
      if (lo === tails.length) tails.push(num); else tails[lo] = num;
    }
    return tails.length;
  }
}`,
javaCode: `
class Solution {
    public int lengthOfLIS(int[] nums) {
        List<Integer> tails = new ArrayList<>();
        for (int num : nums) {
            int lo = 0, hi = tails.size();
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                if (tails.get(mid) < num) lo = mid + 1;
                else hi = mid;
            }
            if (lo == tails.size()) tails.add(num);
            else tails.set(lo, num);
        }
        return tails.size();
    }
}
`,
cppCode: `class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        vector<int> tails;
        for (int n : nums) {
            auto it = lower_bound(tails.begin(), tails.end(), n);
            if (it == tails.end()) tails.push_back(n);
            else *it = n;
        }
        return tails.size();
    }
};`,
},
  322: {
pythonCode: `class Solution:
    def coinChange(self, coins, amount):
        dp = [float('inf')] * (amount+1)
        dp[0] = 0
        for i in range(1, amount+1):
            for c in coins:
                if c <= i and dp[i-c]+1 < dp[i]: dp[i] = dp[i-c]+1
        return dp[amount] if dp[amount] != float('inf') else -1`,
typescriptCode: `class Solution {
  coinChange(coins: number[], amount: number): number {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (let i = 1; i <= amount; i++)
      for (const c of coins)
        if (c <= i && dp[i - c] + 1 < dp[i]) dp[i] = dp[i - c] + 1;
    return dp[amount] === Infinity ? -1 : dp[amount];
  }
}`,
javaCode: `
class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;
        for (int i = 1; i <= amount; i++) {
            for (int coin : coins) {
                if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}
`,
cppCode: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        vector<int> dp(amount+1, amount+1); dp[0] = 0;
        for (int i = 1; i <= amount; i++)
            for (int c : coins)
                if (c <= i) dp[i] = min(dp[i], dp[i-c]+1);
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
},
  383: {
pythonCode: `class Solution:
    def canConstruct(self, ransomNote, magazine):
        from collections import Counter
        return not (Counter(ransomNote) - Counter(magazine))`,
typescriptCode: `class Solution {
  canConstruct(ransomNote: string, magazine: string): boolean {
    const count = new Array(26).fill(0);
    for (const c of magazine) count[c.charCodeAt(0)-97]++;
    for (const c of ransomNote) if (--count[c.charCodeAt(0)-97] < 0) return false;
    return true;
  }
}`,
javaCode: `
class Solution {
    public boolean canConstruct(String ransomNote, String magazine) {
        int[] count = new int[26];
        for (char ch : magazine.toCharArray()) count[ch - 'a']++;
        for (char ch : ransomNote.toCharArray()) {
            if (--count[ch - 'a'] < 0) return false;
        }
        return true;
    }
}
`,
cppCode: `
class Solution {
public:
    bool canConstruct(string ransomNote, string magazine) {
        int count[26]={};
        for(char c:magazine)count[c-'a']++;
        for(char c:ransomNote)if(--count[c-'a']<0)return false;
        return true;
    }
};`,
},
  392: {
pythonCode: `class Solution:
    def isSubsequence(self, s, t):
        i = 0
        for ch in t:
            if i < len(s) and ch == s[i]: i += 1
        return i == len(s)`,
typescriptCode: `class Solution {
  isSubsequence(s: string, t: string): boolean {
    let i = 0;
    for (const ch of t) if (i < s.length && ch === s[i]) i++;
    return i === s.length;
  }
}`,
javaCode: `
class Solution {
    public boolean isSubsequence(String s, String t) {
        int i = 0;
        for (int j = 0; j < t.length() && i < s.length(); j++) {
            if (t.charAt(j) == s.charAt(i)) i++;
        }
        return i == s.length();
    }
}
`,
cppCode: `
class Solution {
public:
    bool isSubsequence(string s, string t) {
        int i=0; for(char ch:t) if(i<s.size()&&ch==s[i])i++;
        return i==s.size();
    }
};`,
},
  399: {
pythonCode: `class Solution:
    def calcEquation(self, equations, values, queries):
        g = {}
        for (a,b), v in zip(equations, values):
            g.setdefault(a,{})[b] = v
            g.setdefault(b,{})[a] = 1/v
        def dfs(s, e, vis):
            if s not in g or e not in g: return -1
            if s == e: return 1
            vis.add(s)
            for nb, w in g[s].items():
                if nb not in vis:
                    r = dfs(nb, e, vis)
                    if r != -1: return w * r
            return -1
        return [dfs(a,b,set()) for a,b in queries]`,
typescriptCode: `class Solution {
  calcEquation(equations: string[][], values: number[], queries: string[][]): number[] {
    const g = new Map<string, Map<string, number>>();
    for (let i = 0; i < equations.length; i++) {
      const [a,b] = equations[i];
      if (!g.has(a)) g.set(a, new Map()); if (!g.has(b)) g.set(b, new Map());
      g.get(a)!.set(b, values[i]); g.get(b)!.set(a, 1/values[i]);
    }
    const dfs = (s: string, e: string, vis: Set<string>): number => {
      if (!g.has(s)||!g.has(e)) return -1; if (s===e) return 1;
      vis.add(s);
      for (const [nb,w] of g.get(s)!.entries())
        if (!vis.has(nb)) { const r = dfs(nb,e,vis); if (r!==-1) return w*r; }
      return -1;
    };
    return queries.map(([a,b]) => dfs(a,b,new Set()));
  }
}`,
javaCode: `
class Solution {
    public double[] calcEquation(List<List<String>> equations, double[] values, List<List<String>> queries) {
        Map<String, Map<String, Double>> graph = new HashMap<>();
        for (int i = 0; i < equations.size(); i++) {
            String a = equations.get(i).get(0), b = equations.get(i).get(1);
            graph.computeIfAbsent(a, k -> new HashMap<>()).put(b, values[i]);
            graph.computeIfAbsent(b, k -> new HashMap<>()).put(a, 1.0 / values[i]);
        }
        double[] result = new double[queries.size()];
        for (int i = 0; i < queries.size(); i++) {
            String s = queries.get(i).get(0), e = queries.get(i).get(1);
            result[i] = (!graph.containsKey(s) || !graph.containsKey(e)) ? -1 : dfs(graph, s, e, new HashSet<>());
        }
        return result;
    }
    private double dfs(Map<String, Map<String, Double>> g, String s, String e, Set<String> v) {
        if (s.equals(e)) return 1;
        v.add(s);
        for (Map.Entry<String, Double> nb : g.getOrDefault(s, new HashMap<>()).entrySet()) {
            if (!v.contains(nb.getKey())) {
                double r = dfs(g, nb.getKey(), e, v);
                if (r != -1) return r * nb.getValue();
            }
        }
        return -1;
    }
}
`,
cppCode: `class Solution {
public:
    vector<double> calcEquation(vector<vector<string>>& equations, vector<double>& values, vector<vector<string>>& queries) {
        unordered_map<string, unordered_map<string, double>> g;
        for (int i = 0; i < equations.size(); i++) {
            g[equations[i][0]][equations[i][1]] = values[i];
            g[equations[i][1]][equations[i][0]] = 1.0/values[i];
        }
        vector<double> result(queries.size());
        for (int i = 0; i < queries.size(); i++) {
            unordered_set<string> vis;
            result[i] = dfs(g, queries[i][0], queries[i][1], vis);
        }
        return result;
    }
    double dfs(auto& g, string s, string e, unordered_set<string>& v) {
        if (s == e) return 1;
        v.insert(s);
        for (auto& [nb, w] : g[s]) {
            if (!v.count(nb)) { double r = dfs(g, nb, e, v); if (r != -1) return r * w; }
        }
        return -1;
    }
};`,
},
  452: {
pythonCode: `class Solution:
    def findMinArrowShots(self, points):
        points.sort(key=lambda x: x[1])
        arrows = 1
        end = points[0][1]
        for i in range(1, len(points)):
            if points[i][0] > end:
                arrows += 1
                end = points[i][1]
        return arrows`,
typescriptCode: `class Solution {
  findMinArrowShots(points: number[][]): number {
    points.sort((a, b) => a[1] - b[1]);
    let arrows = 1, end = points[0][1];
    for (let i = 1; i < points.length; i++)
      if (points[i][0] > end) { arrows++; end = points[i][1]; }
    return arrows;
  }
}`,
javaCode: `
class Solution {
    public int findMinArrowShots(int[][] points) {
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1, end = points[0][1];
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > end) { arrows++; end = points[i][1]; }
        }
        return arrows;
    }
}
`,
cppCode: `
class Solution {
public:
    int findMinArrowShots(vector<vector<int>>& points) {
        sort(points.begin(),points.end(),[](auto&a,auto&b){return a[1]<b[1];});
        int arrows=1,end=points[0][1];
        for(int i=1;i<points.size();i++){if(points[i][0]>end){arrows++;end=points[i][1];}}
        return arrows;
    }
};`,
},
  530: {
pythonCode: `class Solution:
    def getMinimumDifference(self, root):
        self.prev = None
        self.best = float('inf')
        def walk(node):
            if not node:
                return
            walk(node.left)
            if self.prev is not None:
                self.best = min(self.best, node.val - self.prev)
            self.prev = node.val
            walk(node.right)
        walk(root)
        return self.best`,
typescriptCode: `class Solution {
  private prev: number | null = null;
  private best = Infinity;
  getMinimumDifference(root: TreeNode | null): number {
    this.prev = null;
    this.best = Infinity;
    this.walk(root);
    return this.best;
  }
  private walk(node: TreeNode | null): void {
    if (!node) return;
    this.walk(node.left);
    if (this.prev !== null) this.best = Math.min(this.best, node.val - this.prev);
    this.prev = node.val;
    this.walk(node.right);
  }
}`,
javaCode: `
class Solution {
    public int getMinimumDifference(TreeNode root) {
        int[] minDiff = {Integer.MAX_VALUE};
        int[] prev = {-1};
        inorder(root, prev, minDiff);
        return minDiff[0];
    }
    private void inorder(TreeNode node, int[] prev, int[] minDiff) {
        if (node == null) return;
        inorder(node.left, prev, minDiff);
        if (prev[0] >= 0) minDiff[0] = Math.min(minDiff[0], node.val - prev[0]);
        prev[0] = node.val;
        inorder(node.right, prev, minDiff);
    }
}
`,
cppCode: `class Solution {
public:
    int getMinimumDifference(TreeNode* root) {
        int prev = -1, minDiff = INT_MAX;
        function<void(TreeNode*)> inorder = [&](TreeNode* n) {
            if (!n) return;
            inorder(n->left);
            if (prev >= 0) minDiff = min(minDiff, n->val - prev);
            prev = n->val;
            inorder(n->right);
        };
        inorder(root); return minDiff;
    }
};`,
},
  637: {
pythonCode: `class Solution:
    def averageOfLevels(self, root):
        result = []
        from collections import deque
        queue = deque([root])
        while queue:
            level_sum = 0
            size = len(queue)
            for _ in range(size):
                node = queue.popleft()
                level_sum += node.val
                if node.left: queue.append(node.left)
                if node.right: queue.append(node.right)
            result.append(level_sum / size)
        return result`,
typescriptCode: `class Solution {
  averageOfLevels(root: TreeNode | null): number[] {
    const r: number[] = []; const q: any[] = [root];
    while (q.length) {
      let sum = 0; const sz = q.length;
      for (let i = 0; i < sz; i++) {
        const n = q.shift(); sum += n.val;
        if (n.left) q.push(n.left); if (n.right) q.push(n.right);
      }
      r.push(sum / sz);
    }
    return r;
  }
}`,
javaCode: `
class Solution {
    public List<Double> averageOfLevels(TreeNode root) {
        List<Double> result = new ArrayList<>();
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            int size = queue.size();
            double sum = 0;
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                sum += node.val;
                if (node.left != null) queue.add(node.left);
                if (node.right != null) queue.add(node.right);
            }
            result.add(sum / size);
        }
        return result;
    }
}
`,
cppCode: `class Solution {
public:
    vector<double> averageOfLevels(TreeNode* root) {
        vector<double> r; queue<TreeNode*> q; q.push(root);
        while (!q.empty()) {
            int sz = q.size(); double sum = 0;
            for (int i = 0; i < sz; i++) {
                TreeNode* n = q.front(); q.pop(); sum += n->val;
                if (n->left) q.push(n->left);
                if (n->right) q.push(n->right);
            }
            r.push_back(sum / sz);
        }
        return r;
    }
};`,
},
  918: {
pythonCode: `class Solution:
    def maxSubarraySumCircular(self, nums):
        total = max_sum = cur_max = min_sum = cur_min = nums[0]
        for num in nums[1:]:
            cur_max = max(cur_max + num, num)
            max_sum = max(max_sum, cur_max)
            cur_min = min(cur_min + num, num)
            min_sum = min(min_sum, cur_min)
            total += num
        return max(max_sum, total - min_sum) if max_sum > 0 else max_sum`,
typescriptCode: `class Solution {
  maxSubarraySumCircular(nums: number[]): number {
    let total = nums[0], maxSum = nums[0], curMax = nums[0], minSum = nums[0], curMin = nums[0];
    for (let i = 1; i < nums.length; i++) {
      curMax = Math.max(curMax + nums[i], nums[i]); maxSum = Math.max(maxSum, curMax);
      curMin = Math.min(curMin + nums[i], nums[i]); minSum = Math.min(minSum, curMin);
      total += nums[i];
    }
    return maxSum > 0 ? Math.max(maxSum, total - minSum) : maxSum;
  }
}`,
javaCode: `
class Solution {
    public int maxSubarraySumCircular(int[] nums) {
        int total = 0, maxSum = nums[0], currMax = 0, minSum = nums[0], currMin = 0;
        for (int num : nums) {
            currMax = Math.max(num, currMax + num);
            maxSum = Math.max(maxSum, currMax);
            currMin = Math.min(num, currMin + num);
            minSum = Math.min(minSum, currMin);
            total += num;
        }
        return (total == minSum) ? maxSum : Math.max(maxSum, total - minSum);
    }
}
`,
cppCode: `class Solution {
public:
    int maxSubarraySumCircular(vector<int>& nums) {
        int total = 0, maxSum = nums[0], curMax = 0, minSum = nums[0], curMin = 0;
        for (int n : nums) {
            curMax = max(n, curMax+n); maxSum = max(maxSum, curMax);
            curMin = min(n, curMin+n); minSum = min(minSum, curMin);
            total += n;
        }
        return (total == minSum) ? maxSum : max(maxSum, total-minSum);
    }
};`,
},
};
