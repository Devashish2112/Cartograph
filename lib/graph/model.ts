import type { ParseResult, ParsedFile } from "../parser/types";
import { foldDirectories, type FolderGroup } from "./fold";

export type FileCategory = {
  id: string;
  label: string;
  color: string;
  count: number;
};

export type GraphFile = {
  path: string;
  label: string;
  lineCount: number;
  categoryId: string;
  categoryColor: string;
  fanIn: number;
  fanOut: number;
};

export type GraphNode = {
  id: string;
  label: string;
  directory: string;
  files: GraphFile[];
  fileCount: number;
  fanIn: number;
  fanOut: number;
  width: number;
  height: number;
  expanded: boolean;
};

export type GraphNodeEdge = {
  from: string;
  to: string;
};

export type ExplorerModel = {
  repositoryName: string;
  categories: FileCategory[];
  nodes: GraphNode[];
  nodeEdges: GraphNodeEdge[];
  nodeByFile: Map<string, string>;
  fileByPath: Map<string, GraphFile>;
};

type CategoryDefinition = {
  id: string;
  label: string;
  color: string;
  extensions: ReadonlySet<string>;
};

const CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
  {
    id: "tsx",
    label: "TSX",
    color: "var(--category-2)",
    extensions: new Set([".tsx"]),
  },
  {
    id: "ts",
    label: "TypeScript",
    color: "var(--category-1)",
    extensions: new Set([".ts", ".mts", ".cts"]),
  },
  {
    id: "jsx",
    label: "JSX",
    color: "var(--category-4)",
    extensions: new Set([".jsx"]),
  },
  {
    id: "js",
    label: "JavaScript",
    color: "var(--category-3)",
    extensions: new Set([".js", ".mjs", ".cjs"]),
  },
];

const FALLBACK_CATEGORY: CategoryDefinition = {
  id: "other",
  label: "Other",
  color: "var(--category-5)",
  extensions: new Set(),
};

const LABEL_CHARACTER_WIDTH = 6.6;
const MIN_NODE_WIDTH = 104;
const MAX_NODE_WIDTH = 220;
const PANEL_MIN_WIDTH = 250;
const PANEL_MAX_WIDTH = 320;
const MIN_NODE_HEIGHT = 36;
const MAX_NODE_HEIGHT = 96;
export const PANEL_MAX_ROWS = 12;
export const PANEL_HEADER_HEIGHT = 44;
export const PANEL_ROW_HEIGHT = 22;
const PANEL_BORDER = 2;

function categoryFor(extension: string): CategoryDefinition {
  for (const definition of CATEGORY_DEFINITIONS) {
    if (definition.extensions.has(extension)) {
      return definition;
    }
  }

  return FALLBACK_CATEGORY;
}

function countCategories(files: readonly ParsedFile[]): FileCategory[] {
  const counts = new Map<string, number>();

  for (const file of files) {
    const definition = categoryFor(file.extension);
    counts.set(definition.id, (counts.get(definition.id) ?? 0) + 1);
  }

  return [...CATEGORY_DEFINITIONS, FALLBACK_CATEGORY]
    .filter((definition) => (counts.get(definition.id) ?? 0) > 0)
    .map((definition) => ({
      id: definition.id,
      label: definition.label,
      color: definition.color,
      count: counts.get(definition.id) ?? 0,
    }));
}

/**
 * A label starts as the directory's own name. If another visible node has the
 * same name, it grows one parent segment at a time until it is unique. The
 * shortest unique form wins, so labels stay as small as the graph allows.
 */
function assignLabels(
  groups: readonly FolderGroup[],
  repositoryName: string,
): Map<string, string> {
  const segments = new Map<string, string[]>();
  let longest = 1;

  for (const group of groups) {
    const parts =
      group.id === "." ? [repositoryName] : group.id.split("/");
    segments.set(group.id, parts);
    longest = Math.max(longest, parts.length);
  }

  const labels = new Map<string, string>();
  const unresolved = new Set(groups.map((group) => group.id));

  for (let depth = 1; depth <= longest && unresolved.size > 0; depth += 1) {
    const candidates = new Map<string, string[]>();

    for (const id of unresolved) {
      const parts = segments.get(id);

      if (!parts) {
        continue;
      }

      const candidate = parts
        .slice(Math.max(0, parts.length - depth))
        .join("/");
      const matches = candidates.get(candidate) ?? [];
      matches.push(id);
      candidates.set(candidate, matches);
    }

    for (const [candidate, ids] of candidates) {
      if (ids.length === 1) {
        labels.set(ids[0], candidate);
        unresolved.delete(ids[0]);
      }
    }
  }

  for (const id of unresolved) {
    labels.set(id, segments.get(id)?.join("/") ?? id);
  }

  return labels;
}

function labelWidth(label: string): number {
  return Math.min(
    MAX_NODE_WIDTH,
    Math.max(
      MIN_NODE_WIDTH,
      Math.round(label.length * LABEL_CHARACTER_WIDTH + 24),
    ),
  );
}

/**
 * Height is the fan-in signal. A node with many dependants is taller; a long
 * name is not. Width comes from the label instead.
 */
function nodeHeight(fanIn: number): number {
  return Math.min(
    MAX_NODE_HEIGHT,
    Math.max(MIN_NODE_HEIGHT, Math.round(30 + Math.sqrt(fanIn) * 12)),
  );
}

function panelWidth(label: string): number {
  return Math.max(
    PANEL_MIN_WIDTH,
    Math.min(PANEL_MAX_WIDTH, labelWidth(label)),
  );
}

function panelHeight(fileCount: number): number {
  return (
    PANEL_HEADER_HEIGHT +
    Math.min(fileCount, PANEL_MAX_ROWS) * PANEL_ROW_HEIGHT +
    PANEL_BORDER
  );
}

function relativeLabel(path: string, directory: string): string {
  if (directory === ".") {
    return path;
  }

  return path.startsWith(`${directory}/`)
    ? path.slice(directory.length + 1)
    : path;
}

export function visibleFiles(node: GraphNode): GraphFile[] {
  return node.files.slice(0, PANEL_MAX_ROWS);
}

/**
 * Pure graph construction over the parser's output. Expansion only changes
 * dimensions and edge handles; the underlying groups and edges are the same
 * for every view.
 */
export function buildExplorerModel(
  result: ParseResult,
  expandedIds: ReadonlySet<string>,
): ExplorerModel {
  const folded = foldDirectories(result.files);
  const labels = assignLabels(folded.groups, result.repository.name);
  const categories = countCategories(result.files);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  const nodeEdgeKeys = new Set<string>();

  for (const group of folded.groups) {
    incoming.set(group.id, new Set());
    outgoing.set(group.id, new Set());
  }

  for (const edge of result.edges) {
    const from = folded.nodeByFile.get(edge.from);
    const to = folded.nodeByFile.get(edge.to);

    if (!from || !to || from === to) {
      continue;
    }

    outgoing.get(from)?.add(edge.to);
    incoming.get(to)?.add(edge.from);
    nodeEdgeKeys.add(`${from}\u0000${to}`);
  }

  const nodes: GraphNode[] = folded.groups.map((group) => {
    const label = labels.get(group.id) ?? group.id;
    const expanded = expandedIds.has(group.id);
    const fanIn = incoming.get(group.id)?.size ?? 0;
    const fanOut = outgoing.get(group.id)?.size ?? 0;
    const files = group.files
      .slice()
      .sort((left, right) => left.path.localeCompare(right.path))
      .map((file) => {
        const category = categoryById.get(categoryFor(file.extension).id);

        return {
          path: file.path,
          label: relativeLabel(file.path, group.id),
          lineCount: file.lineCount,
          categoryId: category?.id ?? FALLBACK_CATEGORY.id,
          categoryColor: category?.color ?? FALLBACK_CATEGORY.color,
          fanIn: file.fanIn,
          fanOut: file.fanOut,
        };
      });

    return {
      id: group.id,
      label,
      directory: group.id,
      files,
      fileCount: files.length,
      fanIn,
      fanOut,
      width: expanded ? panelWidth(label) : labelWidth(label),
      height: expanded ? panelHeight(files.length) : nodeHeight(fanIn),
      expanded,
    };
  });

  const nodeEdges: GraphNodeEdge[] = [...nodeEdgeKeys]
    .map((key) => {
      const [from, to] = key.split("\u0000");
      return { from, to };
    })
    .sort((left, right) => {
      return (
        left.from.localeCompare(right.from) || left.to.localeCompare(right.to)
      );
    });

  const fileByPath = new Map<string, GraphFile>();

  for (const node of nodes) {
    for (const file of node.files) {
      fileByPath.set(file.path, file);
    }
  }

  return {
    repositoryName: result.repository.name,
    categories,
    nodes,
    nodeEdges,
    nodeByFile: folded.nodeByFile,
    fileByPath,
  };
}

export function nodeById(model: ExplorerModel): Map<string, GraphNode> {
  return new Map(model.nodes.map((node) => [node.id, node]));
}
