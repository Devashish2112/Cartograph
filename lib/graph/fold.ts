import type { ParsedFile } from "../parser/types";

export type FolderGroup = {
  /** The directory the group is named after; "." is the repository root. */
  id: string;
  files: ParsedFile[];
};

export type FoldedGraph = {
  groups: FolderGroup[];
  /** File path to the id of the group that contains it. */
  nodeByFile: Map<string, string>;
  threshold: number;
};

const MIN_THRESHOLD = 2;
const MAX_NODES = 24;

type Directory = {
  directFiles: ParsedFile[];
  parent: string | null;
};

function parentOf(directory: string): string | null {
  if (directory === ".") {
    return null;
  }

  const separator = directory.lastIndexOf("/");
  return separator === -1 ? "." : directory.slice(0, separator);
}

function depthOf(directory: string): number {
  return directory === "." ? 0 : directory.split("/").length;
}

/**
 * Builds the directory tree from the files themselves. Directories that only
 * contain other directories exist as merge targets but hold no files of their
 * own, so they never appear as nodes.
 */
function buildDirectories(files: readonly ParsedFile[]): Map<string, Directory> {
  const directories = new Map<string, Directory>();

  function ensure(directory: string): void {
    if (directories.has(directory)) {
      return;
    }

    directories.set(directory, {
      directFiles: [],
      parent: parentOf(directory),
    });

    const parent = parentOf(directory);

    if (parent !== null) {
      ensure(parent);
    }
  }

  for (const file of files) {
    ensure(file.folder);
    directories.get(file.folder)?.directFiles.push(file);
  }

  return directories;
}

/**
 * One fold pass, starting fresh from the directory tree. Directories are
 * visited deepest-first; a directory below the threshold moves its files into
 * its parent. Because the pass always walks the same tree, raising the
 * threshold and running it again does not inherit a previous pass's merges.
 */
function foldAtThreshold(
  directories: ReadonlyMap<string, Directory>,
  threshold: number,
): Map<string, ParsedFile[]> {
  const groups = new Map<string, ParsedFile[]>();

  for (const [directory, entry] of directories) {
    groups.set(directory, [...entry.directFiles]);
  }

  const order = [...directories.keys()].sort((left, right) => {
    return depthOf(right) - depthOf(left) || right.localeCompare(left);
  });

  for (const directory of order) {
    if (directory === ".") {
      continue;
    }

    const group = groups.get(directory);

    if (!group || group.length >= threshold) {
      continue;
    }

    const parent = parentOf(directory);

    if (parent === null) {
      continue;
    }

    groups.get(parent)?.push(...group);
    groups.delete(directory);
  }

  for (const [directory, group] of groups) {
    if (group.length === 0) {
      groups.delete(directory);
    }
  }

  return groups;
}

/**
 * Every directory starts as a node. Directories with fewer than `threshold`
 * files merge upward, and the threshold rises until the graph fits. The lowest
 * threshold that fits wins, so the repository's own shape decides the depth.
 */
export function foldDirectories(files: readonly ParsedFile[]): FoldedGraph {
  const directories = buildDirectories(files);
  let threshold = MIN_THRESHOLD;

  while (true) {
    const groups = foldAtThreshold(directories, threshold);

    if (groups.size <= MAX_NODES || threshold > files.length) {
      const ordered = [...groups.entries()]
        .map(([id, groupFiles]) => ({ id, files: groupFiles }))
        .sort((left, right) => left.id.localeCompare(right.id));
      const nodeByFile = new Map<string, string>();

      for (const group of ordered) {
        for (const file of group.files) {
          nodeByFile.set(file.path, group.id);
        }
      }

      return { groups: ordered, nodeByFile, threshold };
    }

    threshold += 1;
  }
}
