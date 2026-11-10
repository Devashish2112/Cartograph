import dagre from "@dagrejs/dagre";

import type { GraphNode, GraphNodeEdge } from "./model";

export type NodePosition = {
  x: number;
  y: number;
};

/**
 * Dagre is fed in a fixed order so the same repository and expansion state
 * always produce the same picture. No randomness, no timestamps.
 */
export function layoutGraph(
  nodes: readonly GraphNode[],
  edges: readonly GraphNodeEdge[],
): Map<string, NodePosition> {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: "LR",
    nodesep: 28,
    ranksep: 64,
    marginx: 32,
    marginy: 32,
    acyclicer: "greedy",
    ranker: "network-simplex",
  });
  graph.setDefaultEdgeLabel(() => ({}));

  const orderedNodes = [...nodes].sort((left, right) => {
    return left.id.localeCompare(right.id);
  });

  for (const node of orderedNodes) {
    graph.setNode(node.id, { width: node.width, height: node.height });
  }

  const orderedEdges = [...edges].sort((left, right) => {
    return (
      left.from.localeCompare(right.from) || left.to.localeCompare(right.to)
    );
  });

  for (const edge of orderedEdges) {
    graph.setEdge(edge.from, edge.to);
  }

  dagre.layout(graph);

  const positions = new Map<string, NodePosition>();

  for (const node of orderedNodes) {
    const laidOut = graph.node(node.id);

    if (!laidOut) {
      positions.set(node.id, { x: 0, y: 0 });
      continue;
    }

    positions.set(node.id, {
      x: laidOut.x - node.width / 2,
      y: laidOut.y - node.height / 2,
    });
  }

  return positions;
}
