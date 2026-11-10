import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  Node,
  Project,
  SyntaxKind,
  type SourceFile as MorphSourceFile,
} from "ts-morph";

import { noFrameworkAdapter } from "./adapters/index.ts";
import type { FrameworkAdapter } from "./adapters/types.ts";
import { computeFanCounts, dedupeEdges } from "./graph.ts";
import { ModuleResolver, type SkippedIndexEntry } from "./resolve.ts";
import type {
  Coverage,
  Edge,
  EdgeKind,
  ImportExample,
  ParsedFile,
  ParseResult,
  SkipReason,
  SkippedFile,
} from "./types.ts";
import { walkRepository, type FoundFile } from "./walk.ts";

export type ParseOptions = {
  adapter?: FrameworkAdapter;
};

type ImportOccurrence = {
  from: string;
  specifier: string;
  kind: EdgeKind;
  isTypeOnly: boolean;
};

/** Counts source lines without treating a trailing newline as an extra line. */
function countLines(content: string): number {
  if (content.length === 0) {
    return 0;
  }

  const lines = content.split(/\r\n|\r|\n/);

  if (lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.length;
}

/** Removes a known source extension while preserving the repository path. */
function moduleId(relativePath: string, extension: string): string {
  return extension
    ? relativePath.slice(0, relativePath.length - extension.length)
    : relativePath;
}

/**
 * Collects statically recoverable dependencies without resolving them.
 * CommonJS requires and import-equals declarations use the import kind so
 * downstream coverage and edge handling stay within the parser contract.
 */
function collectOccurrences(sourceFile: MorphSourceFile): ImportOccurrence[] {
  const occurrences: ImportOccurrence[] = [];

  for (const declaration of sourceFile.getImportDeclarations()) {
    const specifier = declaration.getModuleSpecifierValue();

    if (specifier === undefined) {
      continue;
    }

    occurrences.push({
      from: "",
      specifier,
      kind: "import",
      isTypeOnly: declaration.isTypeOnly(),
    });
  }

  for (const declaration of sourceFile.getExportDeclarations()) {
    const specifier = declaration.getModuleSpecifierValue();

    if (specifier === undefined) {
      continue;
    }

    occurrences.push({
      from: "",
      specifier,
      kind: "re-export",
      isTypeOnly: declaration.isTypeOnly(),
    });
  }

  for (const call of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )) {
    const expression = call.getExpression();
    const argument = call.getArguments()[0];

    if (
      Node.isIdentifier(expression) &&
      expression.getText() === "require" &&
      call.getArguments().length === 1 &&
      argument &&
      Node.isStringLiteral(argument)
    ) {
      occurrences.push({
        from: "",
        specifier: argument.getLiteralValue(),
        kind: "import",
        isTypeOnly: false,
      });
      continue;
    }

    if (expression.getKind() !== SyntaxKind.ImportKeyword) {
      continue;
    }

    if (!argument) {
      continue;
    }

    let specifier: string | undefined;

    if (Node.isStringLiteral(argument)) {
      specifier = argument.getLiteralValue();
    } else if (Node.isNoSubstitutionTemplateLiteral(argument)) {
      specifier = argument.getLiteralValue();
    }

    if (specifier === undefined) {
      continue;
    }

    occurrences.push({
      from: "",
      specifier,
      kind: "dynamic",
      isTypeOnly: false,
    });
  }

  for (const declaration of sourceFile.getDescendantsOfKind(
    SyntaxKind.ImportEqualsDeclaration,
  )) {
    const moduleReference = declaration.getModuleReference();

    if (!Node.isExternalModuleReference(moduleReference)) {
      continue;
    }

    const expression = moduleReference.getExpression();

    if (!Node.isStringLiteral(expression)) {
      continue;
    }

    occurrences.push({
      from: "",
      specifier: expression.getLiteralValue(),
      kind: "import",
      isTypeOnly: false,
    });
  }

  return occurrences;
}

function createCoverage(
  found: number,
  parsed: number,
  skipped: readonly SkippedFile[],
): Coverage {
  const skippedByReason: Record<string, number> = {};

  for (const file of skipped) {
    skippedByReason[file.reason] = (skippedByReason[file.reason] ?? 0) + 1;
  }

  return {
    files: {
      found,
      parsed,
      skipped: skipped.length,
      skippedByReason,
    },
    imports: {
      seen: 0,
      resolved: 0,
      external: 0,
      excluded: 0,
      unresolved: 0,
      byKind: {
        import: 0,
        "re-export": 0,
        dynamic: 0,
      },
    },
    reExports: {
      seen: 0,
      resolved: 0,
      external: 0,
      excluded: 0,
      unresolved: 0,
      gaps: [],
    },
    unresolved: [],
    excluded: [],
  };
}

function sortExamples(examples: ImportExample[]): void {
  examples.sort((left, right) => {
    return (
      left.file.localeCompare(right.file) ||
      left.specifier.localeCompare(right.specifier) ||
      left.kind.localeCompare(right.kind) ||
      left.reason.localeCompare(right.reason)
    );
  });
}

/**
 * Parses a repository that is already on disk. This function performs no
 * network access and imports nothing from the web app, the database or a UI
 * library.
 */
export function parseRepository(
  root: string,
  options: ParseOptions = {},
): ParseResult {
  const absoluteRoot = path.resolve(root);
  const adapter = options.adapter ?? noFrameworkAdapter;
  const repositoryName = path.basename(absoluteRoot);
  const walk = walkRepository(absoluteRoot);
  const project = new Project({ useInMemoryFileSystem: true });

  const parsedFiles: ParsedFile[] = [];
  const skipped: SkippedFile[] = [];
  const occurrences: ImportOccurrence[] = [];
  const parsedByAbsolute = new Map<string, string>();
  const skippedByAbsolute = new Map<string, SkippedIndexEntry>();

  function skipFile(
    found: FoundFile,
    reason: SkipReason,
    detail: string | null,
  ): void {
    skipped.push({
      path: found.path,
      folder: found.folder,
      extension: found.extension,
      reason,
      detail,
    });
    skippedByAbsolute.set(found.absolutePath, { reason, detail });
  }

  for (const found of walk.files) {
    if (found.skipReason) {
      skipFile(found, found.skipReason, found.skipDetail);
      continue;
    }

    const language = found.language;

    if (language === null) {
      skipFile(found, "unsupported-extension", "not a source file");
      continue;
    }

    let content: string;

    try {
      content = fs.readFileSync(found.absolutePath, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      skipFile(found, "unreadable", message);
      continue;
    }

    let fileOccurrences: ImportOccurrence[];

    try {
      const sourceFile = project.createSourceFile(
        found.absolutePath,
        content,
        { overwrite: true },
      );
      fileOccurrences = collectOccurrences(sourceFile);
      project.removeSourceFile(sourceFile);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      skipFile(found, "parse-error", message);
      continue;
    }

    for (const occurrence of fileOccurrences) {
      occurrences.push({ ...occurrence, from: found.path });
    }

    parsedFiles.push({
      path: found.path,
      folder: found.folder,
      module: moduleId(found.path, found.extension),
      extension: found.extension,
      language,
      lineCount: countLines(content),
      contentHash: createHash("sha256").update(content).digest("hex"),
      fanIn: 0,
      fanOut: 0,
    });
    parsedByAbsolute.set(found.absolutePath, found.path);
  }

  parsedFiles.sort((left, right) => left.path.localeCompare(right.path));
  skipped.sort((left, right) => left.path.localeCompare(right.path));

  const coverage = createCoverage(
    walk.files.length,
    parsedFiles.length,
    skipped,
  );
  const resolver = new ModuleResolver(
    absoluteRoot,
    parsedByAbsolute,
    skippedByAbsolute,
  );
  const rawEdges: Edge[] = [];

  for (const occurrence of occurrences) {
    coverage.imports.seen += 1;
    coverage.imports.byKind[occurrence.kind] += 1;

    if (occurrence.kind === "re-export") {
      coverage.reExports.seen += 1;
    }

    const resolution = resolver.resolve(
      occurrence.from,
      occurrence.specifier,
    );

    if (resolution.outcome === "resolved") {
      coverage.imports.resolved += 1;

      if (occurrence.kind === "re-export") {
        coverage.reExports.resolved += 1;
      }

      rawEdges.push({
        from: occurrence.from,
        to: resolution.to,
        kind: occurrence.kind,
        specifier: occurrence.specifier,
        isTypeOnly: occurrence.isTypeOnly,
      });
      continue;
    }

    const example: ImportExample = {
      file: occurrence.from,
      specifier: occurrence.specifier,
      kind: occurrence.kind,
      reason: resolution.reason,
    };

    if (resolution.outcome === "external") {
      coverage.imports.external += 1;

      if (occurrence.kind === "re-export") {
        coverage.reExports.external += 1;
        coverage.reExports.gaps.push(example);
      }
      continue;
    }

    if (resolution.outcome === "excluded") {
      coverage.imports.excluded += 1;
      coverage.excluded.push(example);

      if (occurrence.kind === "re-export") {
        coverage.reExports.excluded += 1;
        coverage.reExports.gaps.push(example);
      }
      continue;
    }

    coverage.imports.unresolved += 1;
    coverage.unresolved.push(example);

    if (occurrence.kind === "re-export") {
      coverage.reExports.unresolved += 1;
      coverage.reExports.gaps.push(example);
    }
  }

  const edges = dedupeEdges(rawEdges);
  const fanCounts = computeFanCounts(
    parsedFiles.map((file) => file.path),
    edges,
  );

  for (const file of parsedFiles) {
    file.fanIn = fanCounts.fanIn.get(file.path) ?? 0;
    file.fanOut = fanCounts.fanOut.get(file.path) ?? 0;
  }

  sortExamples(coverage.unresolved);
  sortExamples(coverage.excluded);
  sortExamples(coverage.reExports.gaps);

  const knownFiles = new Set(parsedFiles.map((file) => file.path));
  const entryPoints = adapter
    .entryPoints({ repositoryName, files: parsedFiles })
    .filter((entryPoint) => knownFiles.has(entryPoint))
    .slice()
    .sort();

  return {
    repository: { name: repositoryName },
    adapter: { id: adapter.id, label: adapter.label },
    files: parsedFiles,
    skipped,
    edges,
    entryPoints,
    coverage,
  };
}
