import type { Edge, ParseResult } from "../parser/types";

export type WalkDirection = "dependencies" | "blast-radius";

export type ReachedFile = {
  path: string;
  depth: number;
};

export type ReachedEdge = {
  edge: Edge;
  depth: number;
};

export type InsightKind = "unimported" | "cycle" | "high-fan-in" | "oversized";

export type Insight = {
  kind: InsightKind;
  sentence: string;
  paths: string[];
};

const INSIGHT_SENTENCES: Record<InsightKind, string> = {
  unimported: "Nothing imports these files.",
  cycle: "These files form an import cycle.",
  "high-fan-in": "Many files import these files.",
  oversized: "These files are unusually long.",
};

const MAX_WALK_DEPTH = 2;
const OVERSIZED_LINE_COUNT = 200;

function adjacency(
  edges: readonly Edge[],
  direction: WalkDirection,
): Map<string, string[]> {
  const result = new Map<string, Set<string>>();

  for (const edge of edges) {
    const from = direction === "dependencies" ? edge.from : edge.to;
    const to = direction === "dependencies" ? edge.to : edge.from;
    const neighbors = result.get(from) ?? new Set<string>();
    neighbors.add(to);
    result.set(from, neighbors);
  }

  return new Map(
    [...result].map(([path, neighbors]) => [
      path,
      [...neighbors].sort((left, right) => left.localeCompare(right)),
    ]),
  );
}

export function transitiveFiles(
  path: string,
  edges: readonly Edge[],
  direction: WalkDirection,
  maxDepth = MAX_WALK_DEPTH,
): string[] {
  return transitiveFilesWithDepth(path, edges, direction, maxDepth).map(
    (file) => file.path,
  );
}

export function transitiveFilesWithDepth(
  path: string,
  edges: readonly Edge[],
  direction: WalkDirection,
  maxDepth = MAX_WALK_DEPTH,
): ReachedFile[] {
  if (maxDepth < 1) {
    return [];
  }

  const graph = adjacency(edges, direction);
  const found = new Map<string, number>();
  const queue: Array<{ path: string; depth: number }> = [
    { path, depth: 0 },
  ];
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;
    if (!current || current.depth >= maxDepth) {
      continue;
    }

    for (const neighbor of graph.get(current.path) ?? []) {
      if (found.has(neighbor)) {
        continue;
      }

      const depth = current.depth + 1;
      found.set(neighbor, depth);
      queue.push({ path: neighbor, depth });
    }
  }

  return [...found]
    .map(([filePath, depth]) => ({ path: filePath, depth }))
    .sort(
      (left, right) =>
        left.depth - right.depth || left.path.localeCompare(right.path),
    );
}

export function transitiveEdges(
  path: string,
  edges: readonly Edge[],
  direction: WalkDirection,
  maxDepth = MAX_WALK_DEPTH,
): ReachedEdge[] {
  if (maxDepth < 1) {
    return [];
  }

  const reached = new Map<string, number>([[path, 0]]);
  const queue = [path];
  const result: ReachedEdge[] = [];
  const seenEdges = new Set<string>();
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;
    const currentDepth = reached.get(current);
    if (currentDepth === undefined || currentDepth >= maxDepth) {
      continue;
    }

    for (const edge of edges) {
      const origin =
        direction === "dependencies" ? edge.from : edge.to;
      const next = direction === "dependencies" ? edge.to : edge.from;
      if (origin !== current) {
        continue;
      }

      const depth = currentDepth + 1;
      const edgeId = `${edge.from}\u0000${edge.to}\u0000${edge.kind}\u0000${edge.specifier}\u0000${edge.isTypeOnly}`;
      if (!seenEdges.has(edgeId)) {
        seenEdges.add(edgeId);
        result.push({ edge, depth });
      }
      if (!reached.has(next)) {
        reached.set(next, depth);
        queue.push(next);
      }
    }
  }

  return result.sort(
    (left, right) =>
      left.depth - right.depth ||
      left.edge.from.localeCompare(right.edge.from) ||
      left.edge.to.localeCompare(right.edge.to),
  );
}

function isFrameworkEntryPoint(path: string, entryPoints: ReadonlySet<string>): boolean {
  if (entryPoints.has(path)) {
    return true;
  }

  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const stem = fileName.replace(/\.[^.]+$/, "");
  const directoryParts = path.split("/");
  const isConfigFile =
    stem.endsWith(".config") ||
    stem.startsWith(".") ||
    /^(babel|jest|tsconfig|vite|webpack|rollup|eslint|prettier)$/.test(stem);

  return (
    /^(page|route|layout|loading|error|not-found|template|default)$/.test(stem) ||
    stem === "middleware" ||
    isConfigFile ||
    directoryParts.includes("pages") ||
    directoryParts.includes("app")
  );
}

function canonicalCycle(cycle: string[]): string {
  const rotations = cycle.map((_, index) => [
    ...cycle.slice(index),
    ...cycle.slice(0, index),
  ]);
  return rotations
    .map((rotation) => rotation.join("\u0000"))
    .sort((left, right) => left.localeCompare(right))[0];
}

function findCycles(files: readonly string[], edges: readonly Edge[]): string[][] {
  const graph = adjacency(edges, "dependencies");
  const cycles = new Map<string, string[]>();

  for (const start of files) {
    const visited = new Set<string>();
    const stack: Array<{
      path: string;
      neighbors: string[];
      index: number;
    }> = [{ path: start, neighbors: graph.get(start) ?? [], index: 0 }];
    const pathStack = [start];
    const pathIndex = new Map([[start, 0]]);

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      if (!frame) {
        break;
      }

      if (frame.index >= frame.neighbors.length) {
        visited.add(frame.path);
        pathIndex.delete(frame.path);
        stack.pop();
        pathStack.pop();
        continue;
      }

      const next = frame.neighbors[frame.index];
      frame.index += 1;
      if (!next || visited.has(next)) {
        continue;
      }

      const cycleStart = pathIndex.get(next);
      if (cycleStart !== undefined) {
        const cycle = pathStack.slice(cycleStart);
        if (cycle.length > 1 || graph.get(next)?.includes(next)) {
          cycles.set(canonicalCycle(cycle), cycle);
        }
        continue;
      }

      pathIndex.set(next, pathStack.length);
      pathStack.push(next);
      stack.push({
        path: next,
        neighbors: graph.get(next) ?? [],
        index: 0,
      });
    }
  }

  return [...cycles.values()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  );
}

export function buildInsights(result: ParseResult): Insight[] {
  const entryPoints = new Set(result.entryPoints);
  const incoming = new Map<string, number>();

  for (const file of result.files) {
    incoming.set(file.path, 0);
  }
  for (const edge of result.edges) {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  }

  const unimported = result.files
    .filter(
      (file) =>
        (incoming.get(file.path) ?? 0) === 0 &&
        !isFrameworkEntryPoint(file.path, entryPoints),
    )
    .map((file) => file.path)
    .sort();
  const averageFanIn =
    result.files.length === 0
      ? 0
      : result.files.reduce((sum, file) => sum + file.fanIn, 0) /
        result.files.length;
  const highFanIn = result.files
    .filter(
      (file) =>
        file.fanIn >= 3 &&
        file.fanIn >= Math.max(averageFanIn * 2, averageFanIn + 2),
    )
    .map((file) => file.path)
    .sort();
  const oversized = result.files
    .filter((file) => file.lineCount > OVERSIZED_LINE_COUNT)
    .map((file) => file.path)
    .sort();
  const cycles = findCycles(
    result.files.map((file) => file.path),
    result.edges,
  );

  const insights: Insight[] = [];
  if (unimported.length > 0) {
    insights.push({
      kind: "unimported",
      sentence: INSIGHT_SENTENCES.unimported,
      paths: unimported,
    });
  }
  if (cycles.length > 0) {
    insights.push({
      kind: "cycle",
      sentence: INSIGHT_SENTENCES.cycle,
      paths: [...new Set(cycles.flat())].sort(),
    });
  }
  if (highFanIn.length > 0) {
    insights.push({
      kind: "high-fan-in",
      sentence: INSIGHT_SENTENCES["high-fan-in"],
      paths: highFanIn,
    });
  }
  if (oversized.length > 0) {
    insights.push({
      kind: "oversized",
      sentence: INSIGHT_SENTENCES.oversized,
      paths: oversized,
    });
  }

  return insights;
}
