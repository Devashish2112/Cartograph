import type { GraphNode } from "./model";

export const PANEL_WIDTH = 300;
export const PANEL_HEADER_HEIGHT = 44;
export const PANEL_ROW_HEIGHT = 22;
export const MAX_VISIBLE_ROWS = 12;

export function visibleFiles(node: GraphNode) {
  return node.files;
}

export function panelHeight(fileCount: number): number {
  return (
    PANEL_HEADER_HEIGHT +
    Math.min(fileCount, MAX_VISIBLE_ROWS) * PANEL_ROW_HEIGHT +
    2
  );
}

export function fileHandleId(kind: "in" | "out", filePath: string): string {
  return `${kind}:${filePath}`;
}

export function handleForFile(
  kind: "in" | "out",
  filePath: string,
): string {
  return fileHandleId(kind, filePath);
}
