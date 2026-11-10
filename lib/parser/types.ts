export type SourceLanguage = "typescript" | "javascript";

export type SkipReason =
  | "unsupported-extension"
  | "declaration-file"
  | "symlink"
  | "unreadable"
  | "parse-error";

export type EdgeKind = "import" | "re-export" | "dynamic";

export type ParsedFile = {
  /** Repository-relative path, always using forward slashes. */
  path: string;
  /** Repository-relative directory, or "." for files at the root. */
  folder: string;
  /** The module identity: the path without its extension. */
  module: string;
  extension: string;
  language: SourceLanguage;
  lineCount: number;
  /** SHA-256 of the file contents. */
  contentHash: string;
  fanIn: number;
  fanOut: number;
};

export type SkippedFile = {
  path: string;
  folder: string;
  extension: string;
  reason: SkipReason;
  detail: string | null;
};

export type Edge = {
  from: string;
  to: string;
  kind: EdgeKind;
  specifier: string;
  isTypeOnly: boolean;
};

export type ImportExample = {
  file: string;
  specifier: string;
  kind: EdgeKind;
  reason: string;
};

export type Coverage = {
  files: {
    found: number;
    parsed: number;
    skipped: number;
    skippedByReason: Record<string, number>;
  };
  imports: {
    seen: number;
    resolved: number;
    external: number;
    excluded: number;
    unresolved: number;
    byKind: Record<EdgeKind, number>;
  };
  reExports: {
    seen: number;
    resolved: number;
    external: number;
    excluded: number;
    unresolved: number;
    /** Every re-export that did not become an edge, with the reason why. */
    gaps: ImportExample[];
  };
  /** Every unresolved import, not just a count. */
  unresolved: ImportExample[];
  /** Imports that resolved to a real file that was deliberately not parsed. */
  excluded: ImportExample[];
};

/**
 * This is the parser's contract. Everything built after the parser reads this
 * shape, so changing it is a breaking change, not a refactor.
 */
export type ParseResult = {
  repository: {
    name: string;
  };
  adapter: {
    id: string;
    label: string;
  };
  files: ParsedFile[];
  skipped: SkippedFile[];
  edges: Edge[];
  entryPoints: string[];
  coverage: Coverage;
};
