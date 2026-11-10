"use client";

import { useMemo, useState } from "react";

import type { ParseResult } from "@/lib/parser/types";
import type { ExplorerModel, GraphFile, GraphNode } from "@/lib/graph/model";
import type { Selection } from "@/lib/graph/selection";
import {
  transitiveEdges,
  transitiveFilesWithDepth,
  type ReachedEdge,
  type ReachedFile,
} from "@/lib/graph/analysis";
import type { Insight } from "@/lib/graph/analysis";

type DetailTab = "structure" | "explanation";
type RelationshipView = "direct" | "blast-radius" | "dependencies";

type DetailPanelProps = {
  model: ExplorerModel;
  result: ParseResult;
  selection: Selection | null;
  hoveredPath: string | null;
  hoveredNodeId: string | null;
  onSelectFile: (path: string) => void;
  onHoverPath: (path: string | null) => void;
  insights: Insight[];
};

function extensionLabel(extension: string): string {
  return extension ? extension.slice(1).toUpperCase() : "Other";
}

function uniqueSorted(paths: string[]): string[] {
  return [...new Set(paths)].sort();
}

function PathButton({
  path,
  active,
  onSelect,
  onHover,
}: {
  path: string;
  active: boolean;
  onSelect: () => void;
  onHover: (path: string | null) => void;
}) {
  return (
    <button
      type="button"
      className={`block w-full truncate px-3 py-1 text-left font-mono text-[10px] ${
        active
          ? "bg-accent/10 text-accent"
          : "text-muted hover:bg-surface-muted hover:text-foreground"
      }`}
      title={path}
      onClick={onSelect}
      onMouseEnter={() => onHover(path)}
      onMouseLeave={() => onHover(null)}
    >
      {path}
    </button>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border py-3">
      <div className="flex items-center justify-between px-3">
        <h3 className="text-[10px] font-medium uppercase tracking-wide text-faint">
          {title}
        </h3>
        {count !== undefined ? (
          <span className="font-mono text-[10px] tabular-nums text-faint">
            {count}
          </span>
        ) : null}
      </div>
      <div className="mt-1">{children}</div>
    </section>
  );
}

function Summary({
  model,
  result,
  onSelectFile,
  onHoverPath,
}: {
  model: ExplorerModel;
  result: ParseResult;
  onSelectFile: (path: string) => void;
  onHoverPath: (path: string | null) => void;
}) {
  const mostDependedOn = useMemo(
    () =>
      [...model.fileByPath.values()]
        .filter((file) => file.fanIn > 0)
        .sort(
          (left, right) =>
            right.fanIn - left.fanIn || left.path.localeCompare(right.path),
        )
        .slice(0, 5),
    [model.fileByPath],
  );
  const readingStarts = useMemo(
    () =>
      [...model.fileByPath.values()]
        .filter((file) => file.fanIn === 0)
        .sort((left, right) => left.path.localeCompare(right.path))
        .slice(0, 5),
    [model.fileByPath],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-border px-3 py-3">
        <p className="truncate font-mono text-[13px] font-medium text-foreground">
          {result.repository.name}
        </p>
        <p className="mt-1 text-[11px] text-muted">{result.adapter.label}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Files" value={result.files.length} />
          <Stat label="Imports" value={result.edges.length} />
          <Stat label="Routes" value={result.entryPoints.length} />
          <Stat label="No convention" value={result.files.length} />
        </div>
      </div>

      <Section title="Most depended on">
        {mostDependedOn.length > 0 ? (
          mostDependedOn.map((file) => (
            <RankedFile
              key={file.path}
              file={file}
              onSelectFile={onSelectFile}
              onHoverPath={onHoverPath}
            />
          ))
        ) : (
          <Empty text="No resolved dependants." />
        )}
      </Section>

      <Section title="Start reading">
        {readingStarts.length > 0 ? (
          readingStarts.map((file) => (
            <RankedFile
              key={file.path}
              file={file}
              onSelectFile={onSelectFile}
              onHoverPath={onHoverPath}
            />
          ))
        ) : (
          <Empty text="Every file has a dependant." />
        )}
      </Section>
    </div>
  );
}

function RankedFile({
  file,
  onSelectFile,
  onHoverPath,
}: {
  file: GraphFile;
  onSelectFile: (path: string) => void;
  onHoverPath: (path: string | null) => void;
}) {
  return (
    <PathButton
      path={file.path}
      active={false}
      onSelect={() => onSelectFile(file.path)}
      onHover={onHoverPath}
    />
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-background px-2 py-1.5">
      <p className="font-mono text-[15px] tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] text-faint">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-3 text-[10px] text-faint">{text}</p>;
}

function Insights({
  insights,
  onSelectFile,
  onHoverPath,
}: {
  insights: Insight[];
  onSelectFile: (path: string) => void;
  onHoverPath: (path: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="border-b border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-surface-muted"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="text-[10px] font-medium uppercase tracking-wide text-faint">
          Insights
        </span>
        <span className="font-mono text-[10px] tabular-nums text-faint">
          {insights.length}
        </span>
      </button>
      {open ? (
        <div className="pb-2">
          {insights.length > 0 ? (
            insights.map((insight) => (
              <div key={insight.kind} className="border-t border-border/60 py-2">
                <p className="px-3 text-[10px] text-muted">{insight.sentence}</p>
                <div className="mt-1">
                  {insight.paths.map((path) => (
                    <PathButton
                      key={path}
                      path={path}
                      active={false}
                      onSelect={() => onSelectFile(path)}
                      onHover={onHoverPath}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <Empty text="No graph insights." />
          )}
        </div>
      ) : null}
    </section>
  );
}

function FileStructure({
  file,
  edges,
  dependencies,
  dependants,
  hoveredPath,
  onSelectFile,
  onHoverPath,
}: {
  file: GraphFile;
  edges: ParseResult["edges"];
  dependencies: string[];
  dependants: string[];
  hoveredPath: string | null;
  onSelectFile: (path: string) => void;
  onHoverPath: (path: string | null) => void;
}) {
  const [relationshipView, setRelationshipView] =
    useState<RelationshipView>("direct");
  const blastRadius = transitiveFilesWithDepth(
    file.path,
    edges,
    "blast-radius",
  );
  const dependencyChain = transitiveEdges(
    file.path,
    edges,
    "dependencies",
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-border px-3 py-3">
        <p className="break-all font-mono text-[12px] font-medium text-foreground">
          {file.path}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          {extensionLabel(file.path.slice(file.path.lastIndexOf(".")))} ·{" "}
          {file.lineCount ?? 0} lines
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Depends on" value={dependencies.length} />
          <Stat label="Depended on by" value={dependants.length} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1">
          {(["blast-radius", "dependencies"] as const).map((view) => (
            <button
              key={view}
              type="button"
              className={`border px-2 py-1 text-[10px] ${
                relationshipView === view
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted hover:bg-surface-muted"
              }`}
              onClick={() => setRelationshipView(view)}
            >
              {view === "blast-radius" ? "Blast radius" : "Dependency chain"}
            </button>
          ))}
        </div>
      </div>
      {relationshipView === "direct" ? (
        <>
          <PathSection
            title="Depends on"
            paths={dependencies}
            hoveredPath={hoveredPath}
            onSelectFile={onSelectFile}
            onHoverPath={onHoverPath}
          />
          <PathSection
            title="Depended on by"
            paths={dependants}
            hoveredPath={hoveredPath}
            onSelectFile={onSelectFile}
            onHoverPath={onHoverPath}
          />
        </>
      ) : (
        relationshipView === "blast-radius" ? (
          <ReachedFileSection
            title="Blast radius"
            files={blastRadius}
            hoveredPath={hoveredPath}
            onSelectFile={onSelectFile}
            onHoverPath={onHoverPath}
          />
        ) : (
          <ReachedEdgeSection
            title="Dependency chain"
            edges={dependencyChain}
            hoveredPath={hoveredPath}
            onSelectFile={onSelectFile}
            onHoverPath={onHoverPath}
          />
        )
      )}
    </div>
  );
}

function ReachedFileSection({
  title,
  files,
  hoveredPath,
  onSelectFile,
  onHoverPath,
}: {
  title: string;
  files: ReachedFile[];
  hoveredPath: string | null;
  onSelectFile: (path: string) => void;
  onHoverPath: (path: string | null) => void;
}) {
  return (
    <Section title={title} count={files.length}>
      {files.length > 0 ? (
        files.map((file) => (
          <div
            key={file.path}
            className="flex items-center gap-2 px-3 py-1"
          >
            <button
              type="button"
              className={`min-w-0 flex-1 truncate text-left font-mono text-[10px] ${
                hoveredPath === file.path
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
              title={file.path}
              onClick={() => onSelectFile(file.path)}
              onMouseEnter={() => onHoverPath(file.path)}
              onMouseLeave={() => onHoverPath(null)}
            >
              {file.path}
            </button>
            <span className="shrink-0 font-mono text-[9px] tabular-nums text-faint">
              {file.depth} {file.depth === 1 ? "step" : "steps"}
            </span>
          </div>
        ))
      ) : (
        <Empty text="None within two steps." />
      )}
    </Section>
  );
}

function ReachedEdgeSection({
  title,
  edges,
  hoveredPath,
  onSelectFile,
  onHoverPath,
}: {
  title: string;
  edges: ReachedEdge[];
  hoveredPath: string | null;
  onSelectFile: (path: string) => void;
  onHoverPath: (path: string | null) => void;
}) {
  return (
    <Section title={title} count={edges.length}>
      {edges.length > 0 ? (
        edges.map(({ edge, depth }) => (
          <div
            key={`${edge.from}-${edge.to}-${edge.specifier}-${edge.kind}`}
            className="border-b border-border/60 px-3 py-1.5"
          >
            <button
              type="button"
              className={`block w-full truncate text-left font-mono text-[10px] ${
                hoveredPath === edge.to
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
              title={edge.to}
              onClick={() => onSelectFile(edge.to)}
              onMouseEnter={() => onHoverPath(edge.to)}
              onMouseLeave={() => onHoverPath(null)}
            >
              {edge.to}
            </button>
            <p className="truncate text-[9px] text-faint">
              {edge.kind} · {edge.isTypeOnly ? "type-only · " : ""}
              {edge.specifier} · {depth} {depth === 1 ? "step" : "steps"}
            </p>
          </div>
        ))
      ) : (
        <Empty text="This file imports nothing within two steps." />
      )}
    </Section>
  );
}

function PathSection({
  title,
  paths,
  hoveredPath,
  onSelectFile,
  onHoverPath,
}: {
  title: string;
  paths: string[];
  hoveredPath: string | null;
  onSelectFile: (path: string) => void;
  onHoverPath: (path: string | null) => void;
}) {
  return (
    <Section title={title} count={paths.length}>
      {paths.length > 0 ? (
        paths.map((path) => (
          <PathButton
            key={path}
            path={path}
            active={hoveredPath === path}
            onSelect={() => onSelectFile(path)}
            onHover={onHoverPath}
          />
        ))
      ) : (
        <Empty text="None." />
      )}
    </Section>
  );
}

function FolderStructure({
  node,
  hoveredNodeId,
}: {
  node: GraphNode;
  hoveredNodeId: string | null;
}) {
  const counts = useMemo(() => {
    const values = new Map<string, number>();
    for (const file of node.files) {
      const label = extensionLabel(file.path.slice(file.path.lastIndexOf(".")));
      values.set(label, (values.get(label) ?? 0) + 1);
    }
    return [...values.entries()].sort((left, right) => left[0].localeCompare(right[0]));
  }, [node.files]);

  return (
    <div className={`h-full overflow-y-auto ${hoveredNodeId === node.id ? "bg-accent/5" : ""}`}>
      <div className="border-b border-border px-3 py-3">
        <p className="break-all font-mono text-[12px] font-medium text-foreground">
          {node.directory}
        </p>
        <p className="mt-1 text-[11px] text-muted">{node.files.length} files</p>
      </div>
      <Section title="File types">
        {counts.map(([label, count]) => (
          <div key={label} className="flex justify-between px-3 py-1 text-[11px]">
            <span className="text-muted">{label}</span>
            <span className="font-mono tabular-nums text-faint">{count}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}

export function DetailPanel({
  model,
  result,
  insights,
  selection,
  hoveredPath,
  hoveredNodeId,
  onSelectFile,
  onHoverPath,
}: DetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>("structure");
  const selectedNode = selection
    ? model.nodes.find((node) => node.id === selection.nodeId) ?? null
    : null;
  const selectedFile =
    selection?.kind === "file"
      ? model.fileByPath.get(selection.path) ?? null
      : null;
  const dependencies = selectedFile
    ? uniqueSorted(
        result.edges
          .filter((edge) => edge.from === selectedFile.path)
          .map((edge) => edge.to),
      )
    : [];
  const dependants = selectedFile
    ? uniqueSorted(
        result.edges
          .filter((edge) => edge.to === selectedFile.path)
          .map((edge) => edge.from),
      )
    : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 border-b border-border">
        {(["structure", "explanation"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`border-b-2 px-3 py-2 text-[10px] capitalize ${
              tab === value
                ? "border-accent text-accent"
                : "border-transparent text-faint hover:text-muted"
            }`}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "explanation" ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-[11px] text-faint">
            No explanation yet.
          </div>
        ) : selection === null ? (
          <div className="h-full overflow-y-auto">
            <Summary
              model={model}
              result={result}
              onSelectFile={onSelectFile}
              onHoverPath={onHoverPath}
            />
            <Insights
              insights={insights}
              onSelectFile={onSelectFile}
              onHoverPath={onHoverPath}
            />
          </div>
        ) : selectedFile ? (
          <FileStructure
            key={selectedFile.path}
            file={selectedFile}
            edges={result.edges}
            dependencies={dependencies}
            dependants={dependants}
            hoveredPath={hoveredPath}
            onSelectFile={onSelectFile}
            onHoverPath={onHoverPath}
          />
        ) : selectedNode ? (
          <FolderStructure node={selectedNode} hoveredNodeId={hoveredNodeId} />
        ) : (
          <Empty text="Selection is no longer available." />
        )}
      </div>
    </div>
  );
}
