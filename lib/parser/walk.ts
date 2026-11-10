import fs from "node:fs";
import path from "node:path";

import type { SkipReason, SourceLanguage } from "./types.ts";

const TYPESCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);
const JAVASCRIPT_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs"]);

/**
 * Directories that are never repository source. Selection is structural: whole
 * directories are kept or ignored, never a size-ranked subset of files.
 */
export const IGNORED_DIRECTORIES: ReadonlySet<string> = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".output",
  ".turbo",
  ".vercel",
  ".yarn",
  ".pnpm-store",
  ".cache",
  ".parcel-cache",
  "dist",
  "build",
  "out",
  "coverage",
  "vendor",
]);

export type FoundFile = {
  absolutePath: string;
  path: string;
  folder: string;
  extension: string;
  language: SourceLanguage | null;
  skipReason: SkipReason | null;
  skipDetail: string | null;
};

export type WalkResult = {
  root: string;
  files: FoundFile[];
};

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function folderOf(relativePath: string): string {
  const folder = path.posix.dirname(relativePath);
  return folder === "." ? "." : folder;
}

function declarationFile(name: string): boolean {
  return (
    name.endsWith(".d.ts") ||
    name.endsWith(".d.mts") ||
    name.endsWith(".d.cts")
  );
}

function classifyFile(
  absolutePath: string,
  relativePath: string,
  name: string,
): FoundFile {
  const extension = path.extname(name).toLowerCase();
  const folder = folderOf(relativePath);

  if (declarationFile(name)) {
    return {
      absolutePath,
      path: relativePath,
      folder,
      extension,
      language: null,
      skipReason: "declaration-file",
      skipDetail: "TypeScript declaration file",
    };
  }

  if (TYPESCRIPT_EXTENSIONS.has(extension)) {
    return {
      absolutePath,
      path: relativePath,
      folder,
      extension,
      language: "typescript",
      skipReason: null,
      skipDetail: null,
    };
  }

  if (JAVASCRIPT_EXTENSIONS.has(extension)) {
    return {
      absolutePath,
      path: relativePath,
      folder,
      extension,
      language: "javascript",
      skipReason: null,
      skipDetail: null,
    };
  }

  return {
    absolutePath,
    path: relativePath,
    folder,
    extension,
    language: null,
    skipReason: "unsupported-extension",
    skipDetail: extension
      ? `extension '${extension}' is not TypeScript or JavaScript`
      : "file has no extension",
  };
}

export function walkRepository(root: string): WalkResult {
  const absoluteRoot = path.resolve(root);
  const files: FoundFile[] = [];

  function visit(directory: string): void {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not read directory ${directory}: ${message}`);
    }

    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);

      if (entry.isSymbolicLink()) {
        if (entry.isDirectory()) {
          continue;
        }

        const relativePath = toPosix(path.relative(absoluteRoot, absolutePath));
        const extension = path.extname(entry.name).toLowerCase();
        files.push({
          absolutePath,
          path: relativePath,
          folder: folderOf(relativePath),
          extension,
          language: null,
          skipReason: "symlink",
          skipDetail: "symbolic links are not followed",
        });
        continue;
      }

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }

        visit(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const relativePath = toPosix(path.relative(absoluteRoot, absolutePath));
      files.push(classifyFile(absolutePath, relativePath, entry.name));
    }
  }

  visit(absoluteRoot);

  files.sort((left, right) => left.path.localeCompare(right.path));

  return { root: absoluteRoot, files };
}
