import type { Edge } from "./types.ts";

export type FanCounts = {
  fanIn: Map<string, number>;
  fanOut: Map<string, number>;
};

/**
 * Exact duplicate edges are removed before anything counts them. Two imports of
 * the same module from the same file are still one relationship for fan counts.
 */
export function dedupeEdges(edges: readonly Edge[]): Edge[] {
  const seen = new Set<string>();
  const unique: Edge[] = [];

  for (const edge of edges) {
    const key = [
      edge.from,
      edge.to,
      edge.kind,
      edge.specifier,
      edge.isTypeOnly ? "type" : "value",
    ].join("\u0000");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(edge);
  }

  unique.sort((left, right) => {
    return (
      left.from.localeCompare(right.from) ||
      left.to.localeCompare(right.to) ||
      left.kind.localeCompare(right.kind) ||
      left.specifier.localeCompare(right.specifier)
    );
  });

  return unique;
}

/**
 * Pure arithmetic over the file list and edge list. Fan-in and fan-out count
 * distinct neighbouring files, not import statements.
 */
export function computeFanCounts(
  filePaths: readonly string[],
  edges: readonly Edge[],
): FanCounts {
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();

  for (const filePath of filePaths) {
    incoming.set(filePath, new Set());
    outgoing.set(filePath, new Set());
  }

  for (const edge of edges) {
    outgoing.get(edge.from)?.add(edge.to);
    incoming.get(edge.to)?.add(edge.from);
  }

  const fanIn = new Map<string, number>();
  const fanOut = new Map<string, number>();

  for (const filePath of filePaths) {
    fanIn.set(filePath, incoming.get(filePath)?.size ?? 0);
    fanOut.set(filePath, outgoing.get(filePath)?.size ?? 0);
  }

  return { fanIn, fanOut };
}
