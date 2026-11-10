import type { FrameworkAdapter } from "./types.ts";

/**
 * The fallback adapter. It assumes no framework, so nothing is an entry point
 * unless a real import points at it.
 */
export const noFrameworkAdapter: FrameworkAdapter = {
  id: "none",
  label: "No framework",
  entryPoints: () => [],
};
