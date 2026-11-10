import type { ParsedFile } from "../types.ts";

export type AdapterContext = {
  repositoryName: string;
  files: readonly ParsedFile[];
};

/**
 * Framework knowledge lives behind this interface. The parser core only knows
 * that an adapter can name files the framework reaches by convention; it never
 * contains a framework check itself.
 */
export type FrameworkAdapter = {
  readonly id: string;
  readonly label: string;
  entryPoints(context: AdapterContext): readonly string[];
};
