import type { ParsedFile } from "../parser/types.ts";

export type FileCategory = {
  id: string;
  name: string;
  color: string;
  count: number;
};

type CategoryGroup = {
  id: string;
  name: string;
  extensions: readonly string[];
  color: string;
};

/**
 * The parser distinguishes TypeScript from JavaScript; the extension is the
 * finest real distinction it carries. Framework roles replace this taxonomy in
 * a later phase.
 */
const GROUPS: readonly CategoryGroup[] = [
  {
    id: "typescript",
    name: "TypeScript",
    extensions: [".ts", ".mts", ".cts"],
    color: "var(--category-1)",
  },
  {
    id: "tsx",
    name: "TSX",
    extensions: [".tsx"],
    color: "var(--category-2)",
  },
  {
    id: "javascript",
    name: "JavaScript",
    extensions: [".js", ".mjs", ".cjs"],
    color: "var(--category-3)",
  },
  {
    id: "jsx",
    name: "JSX",
    extensions: [".jsx"],
    color: "var(--category-4)",
  },
  {
    id: "other",
    name: "Other",
    extensions: [],
    color: "var(--category-5)",
  },
];

export function categoriesForFiles(
  files: readonly ParsedFile[],
): FileCategory[] {
  const counts = new Map<string, number>();

  for (const file of files) {
    const group =
      GROUPS.find((candidate) => candidate.extensions.includes(file.extension)) ??
      GROUPS[GROUPS.length - 1];

    counts.set(group.id, (counts.get(group.id) ?? 0) + 1);
  }

  return GROUPS.filter((group) => (counts.get(group.id) ?? 0) > 0).map(
    (group) => ({
      id: group.id,
      name: group.name,
      color: group.color,
      count: counts.get(group.id) ?? 0,
    }),
  );
}
