// ---------------------------------------------------------------------------
// NeetCode Roadmap — compile-only tests for Java and C++ solutions.
//
// Catches syntax errors in the 160+ Java/C++ solutions in neetcode-multilang.ts.
// Each solution is written to a temp file and compiled with javac/g++.
// Gracefully skips when the toolchain is unavailable.
// ---------------------------------------------------------------------------

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { neetcodeMultiLang } from "./neetcode-multilang";

// ---------------------------------------------------------------------------
// Tool availability checks
// ---------------------------------------------------------------------------

function javaAvailable(): boolean {
  try {
    execFileSync("javac", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function cppAvailable(): boolean {
  try {
    execFileSync("g++", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const javaOk = javaAvailable();
const cppOk = cppAvailable();

// ---------------------------------------------------------------------------
// Java compile test
// ---------------------------------------------------------------------------

/**
 * LeetCode-compatible boilerplate prepended to every Java solution.
 * Includes imports + common data structures the solutions assume exist.
 */
const JAVA_BOILERPLATE = `import java.util.*;

class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

`;

describe("NeetCode Java solutions compile", () => {
  it.skipIf(!javaOk)("every Java solution compiles with javac", () => {
    const failures: string[] = [];

    for (const [no, entry] of Object.entries(neetcodeMultiLang)) {
      if (!entry?.javaCode) continue;

      const dir = mkdtempSync(join(tmpdir(), `neetcode-java-${no}-`));
      try {
        // Concatenate boilerplate + solution + Main into one file so javac
        // sees all imports and class definitions in a single compilation unit.
        const combined = JAVA_BOILERPLATE + entry.javaCode + `\nclass Main {
    public static void main(String[] args) {
        Solution s = new Solution();
    }
}\n`;
        writeFileSync(join(dir, "Solution.java"), combined);
        execFileSync("javac", ["Solution.java"], {
          cwd: dir,
          stdio: "pipe",
          timeout: 30_000,
        });
      } catch (error) {
        const stderr =
          error instanceof Error ? (error as { stderr?: Buffer }).stderr?.toString() ?? "" : "";
        failures.push(`#${no}: ${stderr.trim() || String(error)}`);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }

    expect(failures).toEqual([]);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// C++ compile test
// ---------------------------------------------------------------------------

/**
 * LeetCode-compatible C++ boilerplate: common includes and data structures.
 */
const CPP_BOILERPLATE = `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <numeric>
#include <functional>
#include <unordered_set>
#include <unordered_map>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <climits>
#include <cmath>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

`;

/** Minimal main that instantiates Solution to verify compilation. */
const CPP_MAIN = `
int main() {
    Solution s;
    return 0;
}
`;

describe("NeetCode C++ solutions compile", () => {
  it.skipIf(!cppOk)("every C++ solution compiles with g++", () => {
    const failures: string[] = [];

    for (const [no, entry] of Object.entries(neetcodeMultiLang)) {
      if (!entry?.cppCode) continue;

      const dir = mkdtempSync(join(tmpdir(), `neetcode-cpp-${no}-`));
      try {
        // Write boilerplate + solution + main into a single file for g++.
        const combined = CPP_BOILERPLATE + entry.cppCode + "\n" + CPP_MAIN;
        writeFileSync(join(dir, "main.cpp"), combined);
        execFileSync("g++", ["-std=c++17", "-O0", "-fsyntax-only", "main.cpp"], {
          cwd: dir,
          stdio: "pipe",
          timeout: 30_000,
        });
      } catch (error) {
        const stderr =
          error instanceof Error ? (error as { stderr?: Buffer }).stderr?.toString() ?? "" : "";
        failures.push(`#${no}: ${stderr.trim() || String(error)}`);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }

    expect(failures).toEqual([]);
  }, 120_000);
});
