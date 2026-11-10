import type { GraphNode } from "./model";

export const PANEL_HEADER_HEIGHT = 44;
export const PANEL_ROW_HEIGHT = 22;
export const PANEL_MAX_ROWS = 12;
export const PANEL_BORDER = 2;

/** Returns every file in a panel before the UI applies its visible-row cap. */
export function scrollableFiles(node: GraphNode) {
  return node.files;
}

/** Calculates the fixed panel header plus its capped file-row height. */
export function panelHeight(fileCount: number): number {
  return (
    PANEL_HEADER_HEIGHT +
    Math.min(fileCount, PANEL_MAX_ROWS) * PANEL_ROW_HEIGHT +
    PANEL_BORDER
  );
}

/** Builds the handle identifier used by a file row in an expanded panel. */
export function fileHandleId(kind: "in" | "out", filePath: string): string {
  return `${kind}:${filePath}`;
}

/** Returns the React Flow handle identifier for a file edge endpoint. */
export function handleForFile(
  kind: "in" | "out",
  filePath: string,
): string {
  return fileHandleId(kind, filePath);
}
