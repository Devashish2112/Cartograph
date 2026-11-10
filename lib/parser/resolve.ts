import fs from "node:fs";
import { isBuiltin } from "node:module";
import path from "node:path";

import { ts } from "ts-morph";

import type { SkipReason } from "./types.ts";
import { IGNORED_DIRECTORIES } from "./walk.ts";

const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
];

const OTHER_EXTENSIONS = [
  ".json",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".md",
  ".mdx",
  ".html",
  ".txt",
  ".yaml",
  ".yml",
  ".toml",
  ".wasm",
  ".graphql",
  ".gql",
  ".vue",
  ".svelte",
  ".astro",
];

const ALL_EXTENSIONS = [...SOURCE_EXTENSIONS, ...OTHER_EXTENSIONS];

const SKIP_REASON_TEXT: Record<SkipReason, string> = {
  "unsupported-extension": "unsupported extension",
  "declaration-file": "declaration file",
  symlink: "symbolic link",
  unreadable: "file could not be read",
  "parse-error": "file could not be parsed",
};

export type SkippedIndexEntry = {
  reason: SkipReason;
  detail: string | null;
};

type LoadedConfig = {
  options: ts.CompilerOptions;
  directory: string;
};

export type Resolution =
  | { outcome: "resolved"; to: string; absolutePath: string }
  | { outcome: "external"; reason: string }
  | { outcome: "excluded"; reason: string }
  | { outcome: "unresolved"; reason: string };

function toRepoPath(root: string, absolutePath: string): string {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function isInside(root: string, absolutePath: string): boolean {
  const relative = path.relative(root, absolutePath);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function ignoredSegment(relativePath: string): string | null {
  for (const segment of relativePath.split("/")) {
    if (IGNORED_DIRECTORIES.has(segment)) {
      return segment;
    }
  }
  return null;
}

function isRelativeSpecifier(specifier: string): boolean {
  return (
    specifier === "." ||
    specifier === ".." ||
    specifier.startsWith("./") ||
    specifier.startsWith("../")
  );
}

function pathAliasPattern(
  specifier: string,
  paths: ts.MapLike<string[]> | undefined,
): string | null {
  if (!paths) {
    return null;
  }

  for (const pattern of Object.keys(paths)) {
    if (pattern.includes("*")) {
      const star = pattern.indexOf("*");
      const prefix = pattern.slice(0, star);
      const suffix = pattern.slice(star + 1);

      if (specifier.startsWith(prefix) && specifier.endsWith(suffix)) {
        return pattern;
      }
    } else if (specifier === pattern) {
      return pattern;
    }
  }

  return null;
}

function excludedReason(entry: SkippedIndexEntry): string {
  const reason = SKIP_REASON_TEXT[entry.reason];
  return entry.detail ? `${reason} (${entry.detail})` : reason;
}

export class ModuleResolver {
  private readonly configs = new Map<string, LoadedConfig | null>();
  private readonly defaultConfig: LoadedConfig;
  private readonly root: string;
  private readonly parsedByAbsolute: ReadonlyMap<string, string>;
  private readonly skippedByAbsolute: ReadonlyMap<string, SkippedIndexEntry>;

  constructor(
    root: string,
    parsedByAbsolute: ReadonlyMap<string, string>,
    skippedByAbsolute: ReadonlyMap<string, SkippedIndexEntry>,
  ) {
    this.root = root;
    this.parsedByAbsolute = parsedByAbsolute;
    this.skippedByAbsolute = skippedByAbsolute;
    this.defaultConfig = {
      directory: root,
      options: {
        allowJs: true,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.Preserve,
        resolveJsonModule: true,
      },
    };
  }

  resolve(from: string, specifier: string): Resolution {
    const fromAbsolute = path.resolve(this.root, from);
    const config = this.optionsFor(fromAbsolute);
    const options = config.options;
    const aliasPattern = pathAliasPattern(specifier, options.paths);
    const isBare =
      !isRelativeSpecifier(specifier) &&
      !path.isAbsolute(specifier) &&
      !specifier.startsWith("#") &&
      aliasPattern === null;

    const resolved = ts.resolveModuleName(
      specifier,
      fromAbsolute,
      options,
      ts.sys,
    ).resolvedModule;

    if (resolved) {
      return this.classifyResolved(
        path.resolve(resolved.resolvedFileName),
        specifier,
        isBare,
      );
    }

    if (isBuiltin(specifier) || specifier.startsWith("node:")) {
      return { outcome: "external", reason: `Node built-in '${specifier}'` };
    }

    if (isRelativeSpecifier(specifier) || path.isAbsolute(specifier)) {
      const existing = this.findExistingFile(specifier, fromAbsolute);

      if (existing) {
        return this.classifyResolved(existing, specifier, false);
      }

      return {
        outcome: "unresolved",
        reason: `relative import '${specifier}' did not resolve to a file`,
      };
    }

    if (aliasPattern) {
      const existing = this.resolveAliasFile(specifier, aliasPattern, config);

      if (existing) {
        return this.classifyResolved(existing, specifier, false);
      }

      return {
        outcome: "unresolved",
        reason: `path alias '${aliasPattern}' did not resolve to a file`,
      };
    }

    if (specifier.startsWith("#")) {
      return {
        outcome: "unresolved",
        reason: `package import map '${specifier}' did not resolve`,
      };
    }

    if (isBare) {
      return {
        outcome: "external",
        reason: `package import '${specifier}'`,
      };
    }

    return {
      outcome: "unresolved",
      reason: `import '${specifier}' did not resolve`,
    };
  }

  private classifyResolved(
    absolutePath: string,
    specifier: string,
    isBare: boolean,
  ): Resolution {
    if (!isInside(this.root, absolutePath)) {
      return {
        outcome: "external",
        reason: `resolved outside the repository: ${absolutePath}`,
      };
    }

    const relativePath = toRepoPath(this.root, absolutePath);
    const ignored = ignoredSegment(relativePath);

    if (ignored) {
      if (isBare) {
        return {
          outcome: "external",
          reason: `package import '${specifier}'`,
        };
      }

      return {
        outcome: "excluded",
        reason: `inside ignored directory '${ignored}'`,
      };
    }

    const parsed = this.parsedByAbsolute.get(absolutePath);

    if (parsed) {
      return { outcome: "resolved", to: parsed, absolutePath };
    }

    const skipped = this.skippedByAbsolute.get(absolutePath);

    if (skipped) {
      return { outcome: "excluded", reason: excludedReason(skipped) };
    }

    const extension = path.extname(absolutePath).toLowerCase();

    if (SOURCE_EXTENSIONS.includes(extension)) {
      return {
        outcome: "excluded",
        reason: "file was not selected as a node",
      };
    }

    return {
      outcome: "excluded",
      reason: extension
        ? `unsupported extension '${extension}'`
        : "file has no extension",
    };
  }

  private resolveAliasFile(
    specifier: string,
    pattern: string,
    config: LoadedConfig,
  ): string | null {
    const targets = config.options.paths?.[pattern];

    if (!targets) {
      return null;
    }

    const star = pattern.indexOf("*");
    let wildcard = "";

    if (star !== -1) {
      const prefix = pattern.slice(0, star);
      const suffix = pattern.slice(star + 1);
      wildcard = specifier.slice(prefix.length, specifier.length - suffix.length);
    }

    const base = config.options.baseUrl
      ? path.resolve(config.directory, config.options.baseUrl)
      : config.directory;

    for (const target of targets) {
      const substituted =
        star === -1 ? target : target.replace("*", wildcard);
      const candidate = this.findExistingFileAt(
        path.resolve(base, substituted),
      );

      if (candidate) {
        return candidate;
      }
    }

    return null;
  }

  private findExistingFile(
    specifier: string,
    fromAbsolute: string,
  ): string | null {
    const base = path.isAbsolute(specifier)
      ? path.join(this.root, specifier)
      : path.resolve(path.dirname(fromAbsolute), specifier);

    return this.findExistingFileAt(base);
  }

  private findExistingFileAt(base: string): string | null {
    const candidates = new Set<string>();
    candidates.add(base);

    const extension = path.extname(base).toLowerCase();

    if (extension) {
      const stem = base.slice(0, -extension.length);
      for (const sourceExtension of SOURCE_EXTENSIONS) {
        candidates.add(`${stem}${sourceExtension}`);
      }
    } else {
      for (const candidateExtension of ALL_EXTENSIONS) {
        candidates.add(`${base}${candidateExtension}`);
        candidates.add(path.join(base, `index${candidateExtension}`));
      }
    }

    for (const candidate of candidates) {
      try {
        if (fs.statSync(candidate).isFile()) {
          return path.resolve(candidate);
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private optionsFor(fileAbsolute: string): LoadedConfig {
    let directory = path.dirname(fileAbsolute);

    while (isInside(this.root, directory)) {
      for (const name of ["tsconfig.json", "jsconfig.json"]) {
        const configPath = path.join(directory, name);

        if (fs.existsSync(configPath)) {
          return this.loadOptions(configPath);
        }
      }

      if (directory === this.root) {
        break;
      }

      const parent = path.dirname(directory);

      if (parent === directory) {
        break;
      }

      directory = parent;
    }

    return this.defaultConfig;
  }

  private loadOptions(configPath: string): LoadedConfig {
    const cached = this.configs.get(configPath);

    if (cached !== undefined) {
      return cached ?? this.defaultConfig;
    }

    const read = ts.readConfigFile(configPath, ts.sys.readFile);

    if (read.error) {
      this.configs.set(configPath, null);
      return this.defaultConfig;
    }

    const parsed = ts.parseJsonConfigFileContent(
      read.config,
      ts.sys,
      path.dirname(configPath),
      undefined,
      configPath,
    );

    const loaded = {
      options: parsed.options,
      directory: path.dirname(configPath),
    };

    this.configs.set(configPath, loaded);
    return loaded;
  }
}
