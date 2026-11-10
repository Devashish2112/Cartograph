"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

export type ModuleNodeData = {
  label: string;
  fileCount: number;
  fanIn: number;
  selected: boolean;
  dimmed: boolean;
};

export type ModuleNodeType = Node<ModuleNodeData, "module">;

export function ModuleNode({ data }: NodeProps<ModuleNodeType>) {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center rounded border bg-surface px-2 text-center font-mono text-[11px] leading-tight ${
        data.selected
          ? "border-accent text-foreground"
          : "border-border-strong text-muted"
      } ${data.dimmed ? "opacity-25" : "opacity-100"}`}
      title={`${data.label} · ${data.fileCount} files · fan-in ${data.fanIn}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!h-1.5 !w-1.5 !border-0 !bg-transparent"
      />
      <span className="truncate">{data.label}</span>
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!h-1.5 !w-1.5 !border-0 !bg-transparent"
      />
    </div>
  );
}
