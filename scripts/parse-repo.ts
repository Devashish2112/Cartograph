import fs from "node:fs";
import path from "node:path";

import { writeTypedDataFile } from "../lib/parser/output.ts";
import { parseRepository } from "../lib/parser/parse.ts";
import type { ParseResult } from "../lib/parser/types.ts";

type CliOptions = {
  root: string;
  out: string | null;
};

function usage(): string {
  return "Usage: pnpm parse <directory> [--out <file.ts>]";
}

function parseArgs(argv: readonly string[]): CliOptions {
  let root: string | null = null;
  let out: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      throw new Error(usage());
    }

    if (argument === "--out") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("--out needs a file path");
      }

      out = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    }

    if (root !== null) {
      throw new Error("Only one directory can be parsed at a time");
    }

    root = argument;
  }

  if (root === null) {
    throw new Error(usage());
  }

  return { root, out };
}

function percent(part: number, total: number): string {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((part / total) * 100)}%`;
}

function printExamples(
  title: string,
  examples: ParseResult["coverage"]["unresolved"],
  limit = 10,
): void {
  if (examples.length === 0) {
    return;
  }

  console.log(`${title}:`);

  for (const example of examples.slice(0, limit)) {
    console.log(
      `  ${example.file} -> "${example.specifier}" (${example.kind}): ${example.reason}`,
    );
  }

  if (examples.length > limit) {
    console.log(`  ... ${examples.length - limit} more in the data file`);
  }
}

function printSummary(result: ParseResult, root: string): void {
  const { coverage } = result;
  const folders = new Set(result.files.map((file) => file.folder));

  console.log(`Repository: ${root}`);
  console.log(`Name: ${result.repository.name}`);
  console.log(`Adapter: ${result.adapter.id} (${result.adapter.label})`);
  console.log("");

  console.log(`Files found: ${coverage.files.found}`);
  console.log(`  parsed: ${coverage.files.parsed}`);
  console.log(`  skipped: ${coverage.files.skipped}`);

  const skipReasons = Object.entries(coverage.files.skippedByReason).sort(
    (left, right) => left[0].localeCompare(right[0]),
  );

  for (const [reason, count] of skipReasons) {
    console.log(`    ${reason}: ${count}`);
  }

  console.log(`Folders (parsed files): ${folders.size}`);
  console.log("");

  console.log(`Edges: ${result.edges.length}`);
  console.log(`Imports seen: ${coverage.imports.seen}`);
  console.log(
    `  resolved: ${coverage.imports.resolved} (${percent(coverage.imports.resolved, coverage.imports.seen)})`,
  );
  console.log(`  external: ${coverage.imports.external}`);
  console.log(`  excluded: ${coverage.imports.excluded}`);
  console.log(`  unresolved: ${coverage.imports.unresolved}`);
  console.log(
    `  by kind: import ${coverage.imports.byKind.import}, re-export ${coverage.imports.byKind["re-export"]}, dynamic ${coverage.imports.byKind.dynamic}`,
  );
  console.log("");

  console.log(`Re-exports found: ${coverage.reExports.seen}`);
  console.log(`Re-exports resolved: ${coverage.reExports.resolved}`);
  console.log(
    `  external: ${coverage.reExports.external}, excluded: ${coverage.reExports.excluded}, unresolved: ${coverage.reExports.unresolved}`,
  );
  console.log("");

  printExamples("Unresolved imports", coverage.unresolved);
  printExamples("Excluded imports", coverage.excluded, 5);
  printExamples("Re-export gaps", coverage.reExports.gaps);

  const mostDependedOn = result.files
    .slice()
    .sort((left, right) => right.fanIn - left.fanIn)
    .slice(0, 5);

  if (mostDependedOn.length > 0) {
    console.log("Most depended on:");
    for (const file of mostDependedOn) {
      console.log(`  ${file.path} (fan-in ${file.fanIn})`);
    }
  }
}

function main(argv: readonly string[]): number {
  try {
    const options = parseArgs(argv);
    const root = path.resolve(options.root);

    if (!fs.statSync(root).isDirectory()) {
      throw new Error(`${root} is not a directory`);
    }

    const result = parseRepository(root);
    printSummary(result, root);

    if (options.out) {
      const written = writeTypedDataFile(result, options.out);
      console.log("");
      console.log(`Wrote ${written}`);
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
