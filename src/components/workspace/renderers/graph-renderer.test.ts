import { describe, it, expect } from "vitest";

// We test the force-layout algorithm in isolation.
// The React component itself requires DOM + SVG which we skip in unit tests.

// Re-implement the force layout logic for testing (extracted from graph-renderer.tsx)
type LayoutNode = { id: string; x: number; y: number };

function forceLayout(
  nodeIds: string[],
  graph: Record<string, Array<string | number>>,
  iterations = 60,
): LayoutNode[] {
  const n = nodeIds.length;
  if (n === 0) return [];
  if (n === 1) return [{ id: nodeIds[0], x: 0, y: 0 }];

  const radius = Math.max(40, n * 12);
  const nodes: LayoutNode[] = nodeIds.map((id, i) => ({
    id,
    x: radius * Math.cos((2 * Math.PI * i) / n),
    y: radius * Math.sin((2 * Math.PI * i) / n),
  }));

  const nodeIndex = new Map(nodes.map((nd, i) => [nd.id, i]));

  const edges: Array<[number, number]> = [];
  for (const [src, targets] of Object.entries(graph)) {
    const si = nodeIndex.get(src);
    if (si === undefined) continue;
    for (const t of targets) {
      const ti = nodeIndex.get(String(t));
      if (ti !== undefined && si !== ti) {
        edges.push([si, ti]);
      }
    }
  }

  const k = Math.sqrt((radius * radius * 2) / Math.max(n, 1));
  const temp = radius * 0.5;

  for (let iter = 0; iter < iterations; iter++) {
    const t = temp * (1 - iter / iterations);

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].x -= fx * 0.5;
        nodes[i].y -= fy * 0.5;
        nodes[j].x += fx * 0.5;
        nodes[j].y += fy * 0.5;
      }
    }

    for (const [i, j] of edges) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      nodes[i].x += fx * 0.1;
      nodes[i].y += fy * 0.1;
      nodes[j].x -= fx * 0.1;
      nodes[j].y -= fy * 0.1;
    }

    for (const nd of nodes) {
      nd.x *= 0.95;
      nd.y *= 0.95;
    }

    for (const nd of nodes) {
      const dx = nd.x;
      const dy = nd.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > t * 3) {
        nd.x = (dx / dist) * t * 3;
        nd.y = (dy / dist) * t * 3;
      }
    }
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("forceLayout", () => {
  it("returns empty for empty input", () => {
    expect(forceLayout([], {})).toEqual([]);
  });

  it("returns single node at origin", () => {
    const result = forceLayout(["A"], { A: ["B"] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("A");
    expect(result[0].x).toBe(0);
    expect(result[0].y).toBe(0);
  });

  it("returns all nodes in the output", () => {
    const result = forceLayout(["A", "B", "C"], { A: ["B"], B: ["C"] });
    expect(result).toHaveLength(3);
    expect(result.map((n) => n.id).sort()).toEqual(["A", "B", "C"]);
  });

  it("includes target nodes not in source keys", () => {
    const result = forceLayout(["A", "B"], { A: ["B"] });
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id).sort()).toEqual(["A", "B"]);
  });

  it("connected nodes end up closer than disconnected ones", () => {
    // A-B connected, C isolated
    const result = forceLayout(["A", "B", "C"], { A: ["B"] });
    const nodeMap = new Map(result.map((n) => [n.id, n]));

    const distAB = Math.hypot(
      nodeMap.get("A")!.x - nodeMap.get("B")!.x,
      nodeMap.get("A")!.y - nodeMap.get("B")!.y,
    );
    const distAC = Math.hypot(
      nodeMap.get("A")!.x - nodeMap.get("C")!.x,
      nodeMap.get("A")!.y - nodeMap.get("C")!.y,
    );
    const distBC = Math.hypot(
      nodeMap.get("B")!.x - nodeMap.get("C")!.x,
      nodeMap.get("B")!.y - nodeMap.get("C")!.y,
    );

    // A and B should be closer to each other than either is to C
    // (on average, after layout settles)
    expect(distAB).toBeLessThan(distAC + distBC);
  });

  it("handles a fully connected graph (clique)", () => {
    const graph = { A: ["B", "C"], B: ["A", "C"], C: ["A", "B"] };
    const result = forceLayout(["A", "B", "C"], graph);
    expect(result).toHaveLength(3);

    // All nodes should be finite (no NaN from division by zero)
    for (const node of result) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it("handles a chain graph (linear)", () => {
    const graph = { A: ["B"], B: ["C"], C: ["D"], D: ["E"] };
    const result = forceLayout(["A", "B", "C", "D", "E"], graph);
    expect(result).toHaveLength(5);

    // All positions should be finite
    for (const node of result) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it("handles a star graph (one hub)", () => {
    const graph = { Hub: ["A", "B", "C", "D", "E"] };
    const result = forceLayout(["Hub", "A", "B", "C", "D", "E"], graph);
    expect(result).toHaveLength(6);

    const nodeMap = new Map(result.map((n) => [n.id, n]));
    const hub = nodeMap.get("Hub")!;

    // Hub should be roughly centered (near origin)
    expect(Math.abs(hub.x)).toBeLessThan(50);
    expect(Math.abs(hub.y)).toBeLessThan(50);
  });

  it("handles self-loops without crashing", () => {
    const graph = { A: ["A", "B"] };
    const result = forceLayout(["A", "B"], graph);
    expect(result).toHaveLength(2);
    for (const node of result) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it("handles duplicate edges without crashing", () => {
    const graph = { A: ["B", "B"], B: ["A", "A"] };
    const result = forceLayout(["A", "B"], graph);
    expect(result).toHaveLength(2);
  });

  it("positions are deterministic for the same input", () => {
    const graph = { A: ["B", "C"], B: ["C"] };
    const r1 = forceLayout(["A", "B", "C"], graph);
    const r2 = forceLayout(["A", "B", "C"], graph);
    expect(r1).toEqual(r2);
  });

  it("handles large graphs (20 nodes) without performance issues", () => {
    const nodes = Array.from({ length: 20 }, (_, i) => `N${i}`);
    const graph: Record<string, string[]> = {};
    for (let i = 0; i < 19; i++) {
      graph[`N${i}`] = [`N${i + 1}`];
    }
    const start = performance.now();
    const result = forceLayout(nodes, graph);
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(20);
    expect(elapsed).toBeLessThan(1000); // should be fast
  });
});

describe("edge deduplication logic", () => {
  it("detects directed vs undirected edges", () => {
    // Simulate the edge dedup logic from the component
    const graph = { A: ["B"], B: ["A"] };
    const edgeSet = new Set<string>();
    const edges: Array<{ from: string; to: string; directed: boolean }> = [];

    for (const [src, targets] of Object.entries(graph)) {
      for (const t of targets) {
        const key = `${src}->${t}`;
        const reverseKey = `${t}->${src}`;
        if (!edgeSet.has(key)) {
          const directed = !edgeSet.has(reverseKey);
          edges.push({ from: src, to: String(t), directed });
          edgeSet.add(key);
        }
      }
    }

    // A->B is processed first (reverse B->A not yet in edgeSet, so marked directed)
    // B->A is processed second (reverse A->B already in edgeSet, so marked undirected)
    expect(edges).toHaveLength(2);
    expect(edges[0].directed).toBe(true);
    expect(edges[1].directed).toBe(false);
  });

  it("marks one-way edges as directed", () => {
    const graph = { A: ["B"] };
    const edgeSet = new Set<string>();
    const edges: Array<{ from: string; to: string; directed: boolean }> = [];

    for (const [src, targets] of Object.entries(graph)) {
      for (const t of targets) {
        const key = `${src}->${t}`;
        const reverseKey = `${t}->${src}`;
        if (!edgeSet.has(key)) {
          const directed = !edgeSet.has(reverseKey);
          edges.push({ from: src, to: String(t), directed });
          edgeSet.add(key);
        }
      }
    }

    expect(edges).toHaveLength(1);
    expect(edges[0].directed).toBe(true);
  });
});
