import type { Edge } from "../parser/types";
import type { ExplorerModel } from "./model";

export type Selection =
  | { kind: "folder"; nodeId: string }
  | { kind: "file"; nodeId: string; path: string };

export type Highlight = {
  nodeIds: Set<string>;
  filePaths: Set<string>;
  edgeKeys: Set<string>;
};

/**
 * Creates a printable identity for one parser edge. Parser edges are already
 * deduplicated by all five identity fields before this value is used.
 */
export function edgeKey(edge: Edge): string {
  return `edge-${encodeURIComponent(
    JSON.stringify([
      edge.from,
      edge.to,
      edge.kind,
      edge.specifier,
      edge.isTypeOnly,
    ]),
  )}`;
}

/**
 * Everything kept at full strength: the selection, its real edges, and the
 * files or nodes those edges terminate on. Everything outside this set dims.
 */
export function computeHighlight(
  model: ExplorerModel,
  edges: readonly Edge[],
  selection: Selection | null,
): Highlight | null {
  if (!selection) {
    return null;
  }

  const nodeIds = new Set<string>();
  const filePaths = new Set<string>();
  const edgeKeys = new Set<string>();
  const node = model.nodes.find((candidate) => candidate.id === selection.nodeId);

  if (!node) {
    return null;
  }

  nodeIds.add(node.id);

  if (selection.kind === "folder") {
    for (const file of node.files) {
      filePaths.add(file.path);
    }
  } else {
    if (!node.files.some((file) => file.path === selection.path)) {
      return null;
    }

    filePaths.add(selection.path);
  }

  for (const edge of edges) {
    const fromNode = model.nodeByFile.get(edge.from);
    const toNode = model.nodeByFile.get(edge.to);
    const touchesSelection =
      selection.kind === "folder"
        ? fromNode === node.id || toNode === node.id
        : edge.from === selection.path || edge.to === selection.path;

    if (!touchesSelection) {
      continue;
    }

    edgeKeys.add(edgeKey(edge));

    if (fromNode) {
      nodeIds.add(fromNode);
    }

    if (toNode) {
      nodeIds.add(toNode);
    }

    filePaths.add(edge.from);
    filePaths.add(edge.to);
  }

  return { nodeIds, filePaths, edgeKeys };
}
