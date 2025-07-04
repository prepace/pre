"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { NODE_COLORS, EDGE_STYLES, calculateTreeLayout } from "./utils";
import BubbleNode from "./BubbleNode";
import { StatsPanel, LegendPanel, GraphPanel } from "./panels";
import AnimatedSvgEdge from "./AnimatedSvgEdge";

// Helper function to sanitize IDs for ReactFlow
function sanitizeId(id) {
  if (!id) return 'unknown';
  // Replace special characters with underscores
  return String(id)
    .replace(/@/g, '_at_')
    .replace(/\./g, '_dot_')
    .replace(/:/g, '_colon_')
    .replace(/\//g, '_slash_')
    .replace(/\s+/g, '_')
    .replace(/[^\w-]/g, '_');
}

function InnerGraphContent({ apiResponse }) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const isInitialized = useRef(false);

  // Create ID mapping to preserve original IDs for display
  const idMapping = useMemo(() => {
    const mapping = new Map();
    const reverseMapping = new Map();

    if (apiResponse?.nodes) {
      apiResponse.nodes.forEach((node) => {
        const sanitizedId = sanitizeId(node.id);
        mapping.set(node.id, sanitizedId);
        reverseMapping.set(sanitizedId, node.id);
      });
    }

    return { mapping, reverseMapping };
  }, [apiResponse]);

  // Node types must be defined outside of useMemo to avoid recreation
  const nodeTypes = useMemo(
    () => ({
      bubble: BubbleNode,
    }),
    []
  );

  // Edge types must be defined outside of useMemo to avoid recreation
  const edgeTypes = useMemo(
    () => ({
      animatedSvgEdge: AnimatedSvgEdge,
      default: 'default',
    }),
    []
  );

  // Create node map with sanitized IDs
  const nodeMap = useMemo(() => {
    const map = new Map();
    if (apiResponse?.nodes) {
      apiResponse.nodes.forEach((node) => {
        const sanitizedId = idMapping.mapping.get(node.id);
        map.set(sanitizedId, {
          ...node,
          id: sanitizedId,
          originalId: node.id
        });
      });
    }
    return map;
  }, [apiResponse, idMapping]);

  // Create adjacency map with sanitized IDs
  const adjacencyMap = useMemo(() => {
    const map = new Map();

    if (apiResponse?.edges) {
      apiResponse.edges.forEach((edge) => {
        const sourceId = idMapping.mapping.get(edge.source);
        const targetId = idMapping.mapping.get(edge.target);

        if (!sourceId || !targetId) {
          console.warn('Edge with missing node:', edge);
          return;
        }

        // Add forward relationship
        if (!map.has(sourceId)) map.set(sourceId, new Map());
        const sourceRelations = map.get(sourceId);
        if (!sourceRelations.has(edge.relation)) {
          sourceRelations.set(edge.relation, new Set());
        }
        sourceRelations.get(edge.relation).add(targetId);

        // Add reverse relationship for bidirectional edges
        if (edge.relation === "mentioned_together") {
          if (!map.has(targetId)) map.set(targetId, new Map());
          const targetRelations = map.get(targetId);
          if (!targetRelations.has(edge.relation)) {
            targetRelations.set(edge.relation, new Set());
          }
          targetRelations.get(edge.relation).add(sourceId);
        }
      });
    }

    return map;
  }, [apiResponse, idMapping]);

  // Determine root node with sanitized ID
  const rootNodeId = useMemo(() => {
    if (!apiResponse?.nodes || apiResponse.nodes.length === 0) return null;

    let originalRootId = null;

    // Priority 1: Letter node
    const letterNode = apiResponse.nodes.find((n) => n.type === "Letter");
    if (letterNode) originalRootId = letterNode.id;

    // Priority 2: Highest scoring IDENTITY node
    if (!originalRootId) {
      const identityNodes = apiResponse.nodes
        .filter((n) => n.type === "IDENTITY")
        .sort((a, b) => (b.score || 0) - (a.score || 0));
      if (identityNodes.length > 0) originalRootId = identityNodes[0].id;
    }

    // Priority 3: First node with edges
    if (!originalRootId) {
      const nodesWithEdges = Array.from(adjacencyMap.keys());
      if (nodesWithEdges.length > 0) return nodesWithEdges[0]; // Already sanitized
    }

    // Fallback: First node
    if (!originalRootId) {
      originalRootId = apiResponse.nodes[0].id;
    }

    return idMapping.mapping.get(originalRootId);
  }, [apiResponse, adjacencyMap, idMapping]);

  // State management
  const [expandedNodes, setExpandedNodes] = useState(() =>
    rootNodeId ? new Set([rootNodeId]) : new Set()
  );
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());

  // Update expanded nodes when root changes
  useEffect(() => {
    if (rootNodeId && expandedNodes.size === 0) {
      setExpandedNodes(new Set([rootNodeId]));
    }
  }, [rootNodeId]);

  // Calculate visible nodes and edges based on expanded nodes
  const { visibleNodes, visibleEdges } = useMemo(() => {
    const nodesList = [];
    const edgesList = [];
    const addedNodes = new Set();
    const addedEdges = new Set();

    // Always add root node if it exists
    if (rootNodeId && nodeMap.has(rootNodeId)) {
      nodesList.push(nodeMap.get(rootNodeId));
      addedNodes.add(rootNodeId);
    }

    // Add nodes connected to expanded nodes
    expandedNodes.forEach((nodeId) => {
      if (!nodeMap.has(nodeId)) return;

      const relations = adjacencyMap.get(nodeId);
      if (!relations) return;

      relations.forEach((targets, relation) => {
        targets.forEach((targetId) => {
          // Add target node if not already added
          if (!addedNodes.has(targetId) && nodeMap.has(targetId)) {
            nodesList.push(nodeMap.get(targetId));
            addedNodes.add(targetId);
          }

          // Create deterministic edge ID
          const edgeId = `${nodeId}-${relation}-${targetId}`;
          const reverseEdgeId = `${targetId}-${relation}-${nodeId}`;

          // Avoid duplicate edges for bidirectional relationships
          if (!addedEdges.has(edgeId) && !addedEdges.has(reverseEdgeId)) {
            edgesList.push({
              id: edgeId,
              source: nodeId,
              target: targetId,
              relation,
            });
            addedEdges.add(edgeId);
          }
        });
      });
    });

    return { visibleNodes: nodesList, visibleEdges: edgesList };
  }, [expandedNodes, nodeMap, adjacencyMap, rootNodeId]);

  // Update ReactFlow nodes and edges
  useEffect(() => {
    if (!isInitialized.current && visibleNodes.length === 0) return;

    const flowNodes = visibleNodes.map((node) => ({
      id: node.id, // Already sanitized
      type: "bubble",
      position: { x: 0, y: 0 },
      data: {
        ...node,
        id: node.id,
        label: node.originalId || node.label, // Show original ID as label
        originalLabel: node.label,
        highlightedNodes,
        searchTerm,
        selected: node.id === selectedNode,
      },
    }));

    const flowEdges = visibleEdges.map((edge) => {
      const edgeStyle = EDGE_STYLES[edge.relation] || EDGE_STYLES.default;

      return {
        id: edge.id, // Already sanitized
        source: edge.source,
        target: edge.target,
        type: edge.relation === "mentioned_together" ? "animatedSvgEdge" : "default",
        style: edgeStyle.style || {},
        animated: edgeStyle.animated || false,
        label: edge.relation.replace(/_/g, " "),
        labelStyle: { fontSize: 10, fontWeight: 500 },
        labelBgStyle: { fill: "#1f2937", fillOpacity: 0.8 },
        data: {
          relation: edge.relation,
        },
      };
    });

    // Apply layout
    const layoutResult = calculateTreeLayout(flowNodes, flowEdges, rootNodeId);

    setNodes(layoutResult.nodes);
    setEdges(layoutResult.edges);

    if (!isInitialized.current) {
      isInitialized.current = true;
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    }
  }, [visibleNodes, visibleEdges, rootNodeId, highlightedNodes, searchTerm, selectedNode, setNodes, setEdges, fitView]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    const nodeId = node.id;
    setSelectedNode(nodeId);
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        // Don't remove the last expanded node
        if (newSet.size > 1) {
          newSet.delete(nodeId);
        }
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (term) => {
      setSearchTerm(term);
      if (!term) {
        setHighlightedNodes(new Set());
        return;
      }

      const searchLower = term.toLowerCase();
      const highlighted = new Set(
        visibleNodes
          .filter(
            (node) =>
              (node.label && node.label.toLowerCase().includes(searchLower)) ||
              (node.originalId && node.originalId.toLowerCase().includes(searchLower)) ||
              (node.description && node.description.toLowerCase().includes(searchLower))
          )
          .map((n) => n.id)
      );
      setHighlightedNodes(highlighted);
    },
    [visibleNodes]
  );

  // Handle filter
  const handleFilter = useCallback((type) => {
    setFilterType(type);

    // Update node visibility
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        hidden: type !== "all" && node.data.type !== type,
      }))
    );

    // Update edge visibility
    setEdges((eds) =>
      eds.map((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        const sourceHidden = type !== "all" && sourceNode?.data.type !== type;
        const targetHidden = type !== "all" && targetNode?.data.type !== type;
        return {
          ...edge,
          hidden: sourceHidden || targetHidden,
        };
      })
    );
  }, [setNodes, setEdges, nodes]);

  // Handle reset
  const handleReset = useCallback(() => {
    setSearchTerm("");
    setFilterType("all");
    setHighlightedNodes(new Set());
    setSelectedNode(null);
    setExpandedNodes(rootNodeId ? new Set([rootNodeId]) : new Set());

    // Reset node visibility
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        hidden: false,
      }))
    );

    // Reset edge visibility
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        hidden: false,
      }))
    );

    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [rootNodeId, fitView, setNodes, setEdges]);

  // Calculate stats
   // Calculate stats
  const stats = useMemo(() => {
    const typeCount = {};
    visibleNodes.forEach((node) => {
      typeCount[node.type] = (typeCount[node.type] || 0) + 1;
    });
    return {
      totalNodes: visibleNodes.length,
      totalEdges: visibleEdges.length,
      byType: typeCount,
    };
  }, [visibleNodes, visibleEdges]);

  // MiniMap node color function
  const nodeColorFunc = useCallback((node) => {
    const color = NODE_COLORS[node.data?.type] || NODE_COLORS.default;
    const colorMap = {
      "bg-indigo-600": "#4f46e5",
      "bg-green-600": "#16a34a",
      "bg-yellow-600": "#ca8a04",
      "bg-gray-400": "#9ca3af",
      "bg-purple-600": "#9333ea",
      "bg-pink-600": "#db2777",
      "bg-blue-600": "#2563eb",
      "bg-orange-600": "#ea580c",
      "bg-teal-600": "#0891b2",
      "bg-gray-700": "#374151",
    };
    return colorMap[color] || "#374151";
  }, []);

  if (!apiResponse || !apiResponse.nodes || apiResponse.nodes.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>;
  }

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView={false}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
        }}
      >
        <Background gap={16} color="#374151" variant="dots" />
        <Controls />
        <MiniMap
          nodeColor={nodeColorFunc}
          pannable
          zoomable
          style={{
            backgroundColor: "#1f2937",
            bottom: 130,
            right: 10,
            width: 200,
            height: 150,
          }}
        />
      </ReactFlow>

      <GraphPanel
        onSearch={handleSearch}
        onFilter={handleFilter}
        onReset={handleReset}
        searchTerm={searchTerm}
        filterType={filterType}
      />
      <StatsPanel stats={stats} />
      <LegendPanel />
    </>
  );
}

// Main component wrapped with ReactFlowProvider
export default function InnerGraph({ apiResponse }) {
  return (
    <ReactFlowProvider>
      <InnerGraphContent apiResponse={apiResponse} />
    </ReactFlowProvider>
  );
}
