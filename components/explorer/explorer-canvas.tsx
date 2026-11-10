"use client";

import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeTypes,
  useReactFlow,
} from "@xyflow/react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CategoryRail } from "./category-rail";
import { ModuleNode, type ModuleNodeType } from "./module-node";
import { ModulePanel, type ModulePanelType } from "./module-panel";
import { ExplorerShell } from "./explorer-shell";
import { DetailPanel } from "./detail-panel";
import { parsedRepository } from "@/lib/explorer/preview-data";
import { layoutGraph } from "@/lib/graph/layout";
import { buildExplorerModel } from "@/lib/graph/model";
import { edgeKey, computeHighlight, type Selection } from "@/lib/graph/selection";
import {
  handleForFile,
  MAX_VISIBLE_ROWS,
  visibleFiles,
} from "@/lib/graph/panel";

const nodeTypes: NodeTypes = {
  module: ModuleNode,
  modulePanel: ModulePanel,
};

const MapViewport = memo(function MapViewport({
  nodes,
  edges,
  expandedIds,
  onNodeClick,
  onPaneClick,
}: {
  nodes: Node[];
  edges: Edge[];
  expandedIds: ReadonlySet<string>;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
}) {
  const reactFlow = useReactFlow();
  const previousZoom = useRef(1);

  useEffect(() => {
    if (expandedIds.size === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      reactFlow.fitView({ padding: 0.16, minZoom: previousZoom.current });
      previousZoom.current = reactFlow.getViewport().zoom;
    });

    return () => cancelAnimationFrame(frame);
  }, [expandedIds, reactFlow]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.16 }}
      minZoom={0.25}
      maxZoom={1.6}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
      nodesDraggable={false}
      zoomOnDoubleClick={false}
      className="dependency-map"
    >
      <Background color="var(--map-grid)" gap={24} size={1} />
      <Controls showInteractive={false} position="bottom-left" />
    </ReactFlow>
  );
});

function ExplorerCanvasInner() {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [visibleFilesByNode, setVisibleFilesByNode] = useState<
    ReadonlyMap<string, ReadonlySet<string>>
  >(() => new Map());
  const model = useMemo(
    () => buildExplorerModel(parsedRepository, expandedIds),
    [expandedIds],
  );
  const highlight = useMemo(
    () => {
      const hoverSelection = hoveredPath
        ? (() => {
            const nodeId = model.nodeByFile.get(hoveredPath);
            return nodeId
              ? { kind: "file" as const, nodeId, path: hoveredPath }
              : null;
          })()
        : null;
      return computeHighlight(
        model,
        parsedRepository.edges,
        hoverSelection ?? selection,
      );
    },
    [hoveredPath, model, selection],
  );
  const positions = useMemo(
    () => layoutGraph(model.nodes, model.nodeEdges),
    [model.nodes, model.nodeEdges],
  );

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const selectFile = useCallback((nodeId: string, path: string) => {
    setSelection({ kind: "file", nodeId, path });
  }, []);

  const selectFolder = useCallback((nodeId: string) => {
    setSelection({ kind: "folder", nodeId });
  }, []);

  const closePanel = useCallback((nodeId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      next.delete(nodeId);
      return next;
    });
  }, []);

  const reportVisibleFiles = useCallback(
    (nodeId: string, paths: ReadonlySet<string>) => {
      setVisibleFilesByNode((current) => {
        const next = new Map(current);
        next.set(nodeId, paths);
        return next;
      });
    },
    [],
  );

  const visiblePathsForNode = useCallback(
    (nodeId: string, filePath: string): boolean => {
      const node = model.nodes.find((candidate) => candidate.id === nodeId);

      if (!node?.expanded) {
        return true;
      }

      const paths =
        visibleFilesByNode.get(nodeId) ??
        new Set(visibleFiles(node).slice(0, MAX_VISIBLE_ROWS).map((file) => file.path));

      return paths.has(filePath);
    },
    [model.nodes, visibleFilesByNode],
  );

  const nodes = useMemo<Node[]>(() => {
    return model.nodes.map((node) => {
      const isSelected = selection?.nodeId === node.id;
      const isDimmed = highlight !== null && !highlight.nodeIds.has(node.id);
      const data = {
        node,
        label: node.label,
        selected: isSelected,
        dimmed: isDimmed,
        activeFiles: highlight?.filePaths ?? null,
        selectedFile:
          selection?.kind === "file" && selection.nodeId === node.id
            ? selection.path
            : null,
        fileCount: node.fileCount,
        fanIn: node.fanIn,
        onClose: closePanel,
        onSelectFile: selectFile,
        onVisibleFilesChange: reportVisibleFiles,
        onHoverNode: setHoveredNodeId,
        onHoverFile: setHoveredPath,
      };

      return {
        id: node.id,
        type: node.expanded ? "modulePanel" : "module",
        position: positions.get(node.id) ?? { x: 0, y: 0 },
        data,
        style: { width: node.width, height: node.height },
        draggable: false,
        selectable: false,
      } as ModuleNodeType | ModulePanelType;
    });
  }, [
    closePanel,
    highlight,
    model.nodes,
    positions,
    reportVisibleFiles,
    selectFile,
    selection,
    setHoveredNodeId,
    setHoveredPath,
  ]);

  const edges = useMemo<Edge[]>(() => {
    return parsedRepository.edges.flatMap((edge) => {
      const source = model.nodeByFile.get(edge.from);
      const target = model.nodeByFile.get(edge.to);

      if (!source || !target || source === target) {
        return [];
      }

      const sourceNode = model.nodes.find((node) => node.id === source);
      const targetNode = model.nodes.find((node) => node.id === target);

      if (!sourceNode || !targetNode) {
        return [];
      }

      if (
        !visiblePathsForNode(source, edge.from) ||
        !visiblePathsForNode(target, edge.to)
      ) {
        return [];
      }

      const active = highlight === null || highlight.edgeKeys.has(edgeKey(edge));

      return [
        {
          id: edgeKey(edge),
          source,
          target,
          sourceHandle: sourceNode.expanded
            ? handleForFile("out", edge.from)
            : "out",
          targetHandle: targetNode.expanded
            ? handleForFile("in", edge.to)
            : "in",
          type: "smoothstep",
          animated: false,
          style: {
            stroke: active ? "var(--edge)" : "var(--edge-dim)",
            strokeWidth: active ? 1.15 : 0.8,
            opacity: active ? 0.8 : 0.12,
          },
        },
      ];
    });
  }, [highlight, model, visiblePathsForNode]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const graphNode = model.nodes.find((candidate) => candidate.id === node.id);
      if (!graphNode) {
        return;
      }

      if (graphNode.expanded) {
        selectFolder(graphNode.id);
      } else {
        toggleExpanded(graphNode.id);
        selectFolder(graphNode.id);
      }
    },
    [model.nodes, selectFolder, toggleExpanded],
  );

  const handlePaneClick = useCallback(() => {
    setSelection(null);
  }, []);

  return (
    <ExplorerShell
      rail={<CategoryRail categories={model.categories} />}
      map={
        <MapViewport
          nodes={nodes}
          edges={edges}
          expandedIds={expandedIds}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
        />
      }
      detail={
        <DetailPanel
          model={model}
          result={parsedRepository}
          selection={selection}
          hoveredPath={hoveredPath}
          hoveredNodeId={hoveredNodeId}
          onSelectFile={(path) => {
            const nodeId = model.nodeByFile.get(path);
            if (nodeId) {
              selectFile(nodeId, path);
            }
          }}
          onHoverPath={setHoveredPath}
        />
      }
    />
  );
}

export function ExplorerCanvas() {
  return (
    <ReactFlowProvider>
      <ExplorerCanvasInner />
    </ReactFlowProvider>
  );
}
