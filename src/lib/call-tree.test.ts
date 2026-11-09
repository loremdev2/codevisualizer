import { describe, expect, it } from "vitest";

import { buildCallTree } from "@/lib/call-tree";
import { normalizeSteps } from "@/lib/trace/normalize";
import { runTraceInNode } from "@/lib/trace-runner";
import type { VisualStep } from "@/types/visualizer";

function step(partial: Partial<VisualStep>): VisualStep {
  return { id: 0, ...partial };
}

describe("buildCallTree", () => {
  it("nests calls and marks the returned node with its return value", () => {
    const steps = [
      step({ title: "Call fib", callStack: ["fib(n=5)"] }),
      step({ title: "Call fib", callStack: ["fib(n=5)", "fib(n=4)"] }),
      step({ title: "Call fib", callStack: ["fib(n=5)", "fib(n=4)", "fib(n=3)"] }),
      step({
        title: "Return",
        callStack: ["fib(n=5)", "fib(n=4)", "fib(n=3)"],
        note: "return fib(n-1) + fib(n-2)",
        returnValue: "2",
      }),
      step({
        title: "Return",
        callStack: ["fib(n=5)", "fib(n=4)"],
        note: "return fib(n-1) + fib(n-2)",
        returnValue: "3",
      }),
      step({
        title: "Return",
        callStack: ["fib(n=5)"],
        note: "return fib(n-1) + fib(n-2)",
        returnValue: "5",
      }),
    ];

    const roots = buildCallTree(steps);
    expect(roots).toHaveLength(1);

    const top = roots[0];
    expect(top.label).toBe("fib(n=5)");
    expect(top.returned).toBe(true);
    expect(top.returnExpr).toBe("fib(n-1) + fib(n-2)");
    expect(top.returnValue).toBe("5");
    expect(top.order).toBe(1);

    const child = top.children[0];
    expect(child.label).toBe("fib(n=4)");
    expect(child.returned).toBe(true);
    expect(child.returnValue).toBe("3");

    const grandchild = child.children[0];
    expect(grandchild.label).toBe("fib(n=3)");
    expect(grandchild.returned).toBe(true);
    expect(grandchild.returnValue).toBe("2");
  });

  it("keeps a call without a value return marked returned without a pill value", () => {
    const steps = [
      step({ title: "Call helper", callStack: ["helper(x=1)"] }),
      step({ title: "Return", callStack: ["helper(x=1)"], note: "return" }),
    ];
    const roots = buildCallTree(steps);
    expect(roots[0].returned).toBe(true);
    expect(roots[0].returnValue).toBeUndefined();
  });

  it("prunes frames that left the stack (non-recursive interleavings)", () => {
    const steps = [
      step({ title: "Call a", callStack: ["a()"] }),
      step({ title: "Call b", callStack: ["a()", "b()"] }),
      step({ title: "Return", callStack: ["a()", "b()"], returnValue: "1" }),
      step({ title: "Call b", callStack: ["a()", "b()"] }),
      step({ title: "Return", callStack: ["a()", "b()"], returnValue: "1" }),
    ];
    const roots = buildCallTree(steps);
    expect(roots).toHaveLength(1);
    expect(roots[0].children).toHaveLength(1);
    // The second call to b() from the same parent reuses the same child node.
    expect(roots[0].children[0].returned).toBe(true);
  });

  it("builds multiple roots for sibling top-level calls", () => {
    const steps = [
      step({ title: "Call f", callStack: ["f()"] }),
      step({ title: "Return", callStack: ["f()"], returnValue: "1" }),
      step({ title: "Call g", callStack: ["g()"] }),
      step({ title: "Return", callStack: ["g()"], returnValue: "2" }),
    ];
    const roots = buildCallTree(steps);
    expect(roots.map((root) => root.label)).toEqual(["f()", "g()"]);
  });
});

describe("return-value capture through the tracer", () => {
  it("records the actual computed value on recursive Return steps", async () => {
    const code = `function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
return fib(5);`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok).toBe(true);

    const steps = normalizeSteps(message.steps ?? []);
    const returns = steps.filter((s) => s.title === "Return");
    expect(returns.length).toBeGreaterThan(3);

    // The last Return (the outermost fib(5)) must carry the computed value 5.
    const outerReturn = returns[returns.length - 1];
    expect(outerReturn.returnValue).toBe("5");

    // Some inner returns carry the fib values 1..3.
    const values = returns.map((s) => s.returnValue);
    expect(values).toContain("1");
    expect(values).toContain("2");
    expect(values).toContain("3");
  });

  it("keeps the program's return value intact after the rewrite", async () => {
    const code = `function add(a, b) { return a + b; }
return add(2, 3) * 10;`;
    const message = await runTraceInNode(code, "{}");
    expect(message.ok).toBe(true);
    expect(message.result).toBe(50);
  });

  it("handles bare `return;` statements without breaking", async () => {
    const code = `function maybe(x) {
  if (x < 0) return;
  return x * 2;
}
return maybe(4);`;
    const message = await runTraceInNode(code, "{}");
    expect(message.ok).toBe(true);
    expect(message.result).toBe(8);
  });
});
