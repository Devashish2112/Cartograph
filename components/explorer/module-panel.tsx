"use client";

import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";

import type { GraphNode } from "@/lib/graph/model";
import {
  PANEL_HEADER_HEIGHT,
  PANEL_BORDER,
  PANEL_ROW_HEIGHT,
  panelHeight,
  scrollableFiles,
} from "@/lib/graph/panel";

export type ModulePanelData = {
  node: GraphNode;
  label: string;
  selected: boolean;
  dimmed: boolean;
  activeFiles: ReadonlySet<string> | null;
  selectedFile: string | null;
  onClose: (nodeId: string) => void;
  onSelectFile: (nodeId: string, filePath: string) => void;
  onVisibleFilesChange: (nodeId: string, paths: ReadonlySet<string>) => void;
  onHoverNode: (nodeId: string | null) => void;
  onHoverFile: (path: string | null) => void;
};

export type ModulePanelType = Node<ModulePanelData, "modulePanel">;

function fileLabel(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

export function ModulePanel({
  id,
  data,
}: NodeProps<ModulePanelType>) {
  const visible = scrollableFiles(data.node);
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeId = data.node.id;
  const onVisibleFilesChange = data.onVisibleFilesChange;
  const reportVisibleFiles = useCallback(
    (element: HTMLDivElement) => {
      const firstIndex = Math.max(
        0,
        Math.floor(element.scrollTop / PANEL_ROW_HEIGHT),
      );
      const lastIndex = Math.min(
        visible.length,
        Math.ceil(
          (element.scrollTop + element.clientHeight) / PANEL_ROW_HEIGHT,
        ),
      );

      onVisibleFilesChange(
        nodeId,
        new Set(visible.slice(firstIndex, lastIndex).map((file) => file.path)),
      );
    },
    [nodeId, onVisibleFilesChange, visible],
  );

  useEffect(() => {
    const element = document.querySelector<HTMLDivElement>(
      `[data-panel-scroll="${CSS.escape(id)}"]`,
    );

    if (element) {
      reportVisibleFiles(element);
    }
  }, [id, reportVisibleFiles]);

  return (
    <div
      onMouseEnter={() => data.onHoverNode(nodeId)}
      onMouseLeave={() => data.onHoverNode(null)}
      className={`relative overflow-hidden rounded border bg-surface ${
        data.selected ? "border-accent" : "border-border-strong"
      } ${data.dimmed ? "opacity-25" : "opacity-100"}`}
      style={{ width: "100%", height: panelHeight(data.node.files.length) }}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          data.onClose(data.node.id);
        }}
        className="flex w-full flex-col justify-center border-b border-border px-2.5 text-left hover:bg-surface-muted"
        style={{ height: PANEL_HEADER_HEIGHT }}
        title={`Close ${data.node.directory}`}
      >
        <span className="truncate font-mono text-[11px] font-medium text-foreground">
          {data.label}
        </span>
        <span className="mt-0.5 font-mono text-[9px] text-faint">
          {data.node.files.length} files · in {data.node.fanIn} · out{" "}
          {data.node.fanOut}
        </span>
      </button>

      <div
        data-panel-scroll={id}
        className="overflow-x-hidden overflow-y-auto"
        style={{
          height:
            panelHeight(data.node.files.length) -
            PANEL_HEADER_HEIGHT -
            PANEL_BORDER,
        }}
        onScroll={(event) => {
          reportVisibleFiles(event.currentTarget);
          updateNodeInternals(id);
        }}
      >
        {visible.map((file) => {
          const rowDimmed =
            data.activeFiles !== null && !data.activeFiles.has(file.path);
          const selected = data.selectedFile === file.path;

          return (
            <div key={file.path} className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  data.onSelectFile(data.node.id, file.path);
                }}
                onMouseEnter={() => data.onHoverFile(file.path)}
                onMouseLeave={() => data.onHoverFile(null)}
                className={`flex w-full items-center gap-2 border-b border-border/60 px-2.5 text-left font-mono text-[10px] ${
                  selected
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-surface-muted"
                } ${rowDimmed ? "opacity-25" : "opacity-100"}`}
                style={{ height: PANEL_ROW_HEIGHT }}
                title={file.path}
              >
                <span className="min-w-0 flex-1 truncate">
                  {fileLabel(file.path)}
                </span>
                <span className="shrink-0 text-[9px] tabular-nums text-faint">
                  {file.fanIn}/{file.fanOut}
                </span>
              </button>
              <Handle
                type="target"
                position={Position.Left}
                id={`in:${file.path}`}
                className="!h-1.5 !w-1.5 !border-0 !bg-transparent"
              />
              <Handle
                type="source"
                position={Position.Right}
                id={`out:${file.path}`}
                className="!h-1.5 !w-1.5 !border-0 !bg-transparent"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
