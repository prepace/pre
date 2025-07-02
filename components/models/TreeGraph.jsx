// EnhancedExpandableGraph.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { GraphControls } from './GraphControls';

// Constants (keep all the NODE_COLORS and EDGE_STYLES from before)
const NODE_COLORS = {
  IDENTITY: "bg-indigo-600",
  PERSON: "bg-green-600",
  ADDRESS: "bg-yellow-600",
  CARDINAL: "bg-gray-400",
  PHONE: "bg-purple-600",
  EMAIL: "bg-pink-600",
  Letter: "bg-blue-600",
  DATE: "bg-orange-600",
  LOCATION: "bg-teal-600",
  mentioned_together: "bg-blue-600",
  default: "bg-gray-700",
};

const EDGE_STYLES = {
  mentioned_together: {
    animated: true,
    style: { stroke: "#60a5fa", strokeWidth: 2 },
    markerEnd: { type: MarkerType.Arrow, color: "#60a5fa" },
  },
  IS_NAME: {
    animated: false,
    style: { stroke: "#a78bfa", strokeWidth: 2, strokeDasharray: "5,5" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a78bfa" },
  },
  HAS_ADDRESS: {
    animated: false,
    style: { stroke: "#fbbf24", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.Arrow, color: "#fbbf24" },
  },
  HAS_PHONE: {
    animated: false,
    style: { stroke: "#c084fc", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.Arrow, color: "#c084fc" },
  },
  HAS_EMAIL: {
    animated: false,
    style: { stroke: "#f472b6", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.Arrow, color: "#f472b6" },
  },
  wrote: {
    animated: false,
    style: { stroke: "#10b981", strokeWidth: 2 },
    markerEnd: { type: MarkerType.Arrow, color: "#10b981" },
  },
  sent_to: {
    animated: false,
    style: { stroke: "#3b82f6", strokeWidth: 2 },
    markerEnd: { type: MarkerType.Arrow, color: "#3b82f6" },
  },
  default: {
    animated: false,
    style: { stroke: "#6b7280", strokeWidth: 1 },
    markerEnd: { type: MarkerType.Arrow, color: "#6b7280" },
  },
};

// Keep the calculateTreeLayout function from before
const calculateTreeLayout = (nodes, edges, rootId) => {
  if (!rootId || nodes.length === 0) return { nodes, edges };

  // Build adjacency list
  const childrenMap = new Map();
  const parentMap = new Map();

  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source).push(edge.target);
    parentMap.set(edge.target, edge.source);
  });

  // Calculate depths using BFS
  const depths = new Map();
  const visited = new Set();
  const queue = [{ id: rootId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (visited.has(id)) continue;

    visited.add(id);
    depths.set(id, depth);

    const children = childrenMap.get(id) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, depth: depth + 1 });
      }
    });
  }

  // Group nodes by depth
  const depthGroups = new Map();
  nodes.forEach(node => {
    const depth = depths.get(node.id) ?? 0;
    if (!depthGroups.has(depth)) {
      depthGroups.set(depth, []);
    }
    depthGroups.get(depth).push(node);
  });

  // Calculate positions
  const nodeWidth = 150;
  const nodeHeight = 150;
  const positionedNodes = [];

  depthGroups.forEach((nodesAtDepth, depth) => {
    const y = depth * nodeHeight;
    const totalWidth = nodesAtDepth.length * nodeWidth;
    const startX = -totalWidth / 2;

    nodesAtDepth.forEach((node, index) => {
      positionedNodes.push({
        ...node,
        position: {
          x: startX + index * nodeWidth,
          y: y,
        },
      });
    });
  });

  return { nodes: positionedNodes, edges };
};

// Main component with API integration
export default function EnhancedExpandableGraph({ initialText }) {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState(initialText || '');

  // API call function
  const processText = useCallback(async (text) => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8001/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      setApiResponse(data);
    } catch (err) {
      console.error('Error calling API:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Process initial text on mount
  useEffect(() => {
    if (initialText) {
      processText(initialText);
    }
  }, [initialText, processText]);

  // Input form component
  const InputForm = () => (
    <div className="absolute top-4 left-4 bg-gray-800 p-4 rounded-lg shadow-lg z-10 max-w-md">
      <h3 className="text-white font-semibold mb-2">Process Text</h3>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter letter text with headers..."
        className="w-full h-32 px-3 py-2 bg-gray-700 text-white rounded text-sm resize-none"
      />
      <button
        onClick={() => processText(inputText)}
        disabled={loading || !inputText.trim()}
        className={`mt-2 w-full px-4 py-2 rounded text-white font-medium transition-colors ${
          loading || !inputText.trim()
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {loading ? 'Processing...' : 'Process Text'}
      </button>
      {error && (
        <div className="mt-2 text-red-400 text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );

  // Loading state
  if (!apiResponse && loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
        <div className="text-white text-xl">Processing text...</div>
      </div>
    );
  }

  // No data state
  if (!apiResponse) {
    return (
      <div className="w-full h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700">
        <InputForm />
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 text-lg">
            Enter text above to generate a knowledge graph
          </div>
        </div>
      </div>
    );
  }

  // Main graph view
  return (
    <div className="w-full h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-700">
      <ReactFlowProvider>
        <EnhancedExpandableGraphInner apiResponse={apiResponse} />
        <InputForm />
      </ReactFlowProvider>
    </div>
  );
}

// Start of main component


 function EnhancedExpandableGraphInner({ apiResponse }) {
  const { fitView } = useReactFlow();

  // Create data structures
  const nodeMap = useMemo(() => {
    const map = new Map();
    apiResponse.nodes.forEach(node => map.set(node.id, node));
    return map;
  }, [apiResponse]);

  const adjacencyMap = useMemo(() => {
    const map = new Map();

    apiResponse.edges.forEach(edge => {
      // Source -> Target
      if (!map.has(edge.source)) map.set(edge.source, new Map());
      const sourceRelations = map.get(edge.source);
      if (!sourceRelations.has(edge.relation)) {
        sourceRelations.set(edge.relation, new Set());
      }
      sourceRelations.get(edge.relation).add(edge.target);

      // For bidirectional relations
      if (edge.relation === 'mentioned_together') {
        if (!map.has(edge.target)) map.set(edge.target, new Map());
        const targetRelations = map.get(edge.target);
        if (!targetRelations.has(edge.relation)) {
          targetRelations.set(edge.relation, new Set());
        }
        targetRelations.get(edge.relation).add(edge.source);
      }
    });

    return map;
  }, [apiResponse]);

  // Find root node
  const rootNodeId = useMemo(() => {
    // Try letter nodes first
    const letterNode = apiResponse.nodes.find(n => n.type === 'Letter');
    if (letterNode) return letterNode.id;

    // Then identity nodes with highest score
    const identityNodes = apiResponse.nodes
      .filter(n => n.type === 'IDENTITY')
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    if (identityNodes.length > 0) return identityNodes[0].id;

    // Then any node with outgoing edges
    const nodesWithEdges = Array.from(adjacencyMap.keys());
    if (nodesWithEdges.length > 0) return nodesWithEdges[0];

    // Fallback
    return apiResponse.nodes[0]?.id || null;
  }, [apiResponse, adjacencyMap]);

  // State management
  const [expandedNodes, setExpandedNodes] = useState(new Set([rootNodeId]));
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());

  // Calculate visible nodes and edges based on expanded state
  const { visibleNodes, visibleEdges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    const addedNodes = new Set();
    const addedEdges = new Set();

    // Start with root
    if (rootNodeId && nodeMap.has(rootNodeId)) {
      nodes.push(nodeMap.get(rootNodeId));
      addedNodes.add(rootNodeId);
    }

    // Add expanded nodes and their connections
    expandedNodes.forEach(nodeId => {
      if (!nodeMap.has(nodeId)) return;

      const relations = adjacencyMap.get(nodeId);
      if (!relations) return;

      relations.forEach((targets, relation) => {
        targets.forEach(targetId => {
          // Add target node if not already added
          if (!addedNodes.has(targetId) && nodeMap.has(targetId)) {
            nodes.push(nodeMap.get(targetId));
            addedNodes.add(targetId);
          }

          // Add edge
          const edgeId = `${nodeId}-${relation}-${targetId}`;
          if (!addedEdges.has(edgeId)) {
            edges.push({
              source: nodeId,
              target: targetId,
              relation: relation,
            });
            addedEdges.add(edgeId);
          }
        });
      });
    });

    return { visibleNodes: nodes, visibleEdges: edges };
  }, [expandedNodes, nodeMap, adjacencyMap, rootNodeId]);

  // Convert to ReactFlow format with layout
  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes = visibleNodes.map(node => ({
      id: node.id,
      type: 'bubble',
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        description: node.description || '',
        score: node.score,
      },
    }));

    const edges = visibleEdges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      ...(EDGE_STYLES[edge.relation] || EDGE_STYLES.default),
      label: edge.relation,
      labelStyle: {
        fontSize: 10,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: '#1f2937',
        fillOpacity: 0.8,
      },
    }));

    const layoutResult = calculateTreeLayout(nodes, edges, rootNodeId);
    return { flowNodes: layoutResult.nodes, flowEdges: layoutResult.edges };
  }, [visibleNodes, visibleEdges, rootNodeId]);

  // Enhanced node component with highlighting
  const EnhancedBubbleNode = useCallback(({ data, selected }) => {
    const baseColor = NODE_COLORS[data.type] || NODE_COLORS.default;
    const isHighlighted = highlightedNodes.has(data.id);
    const [showTooltip, setShowTooltip] = useState(false);

    const truncatedLabel = data.label.length > 15
      ? data.label.slice(0, 12) + "..."
      : data.label;

    return (
      <div className="relative">
        <div
          className={`
            select-none rounded-full text-white font-semibold
            ${baseColor}
            cursor-pointer
            flex items-center justify-center text-center
            h-24 w-24 p-2
            transition-all duration-200
            ${selected ? "scale-110 ring-4 ring-indigo-400" : "hover:scale-105"}
            ${isHighlighted ? "ring-4 ring-yellow-400" : ""}
            shadow-lg
            ${!isHighlighted && searchTerm ? "opacity-30" : ""}
          `}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className="text-xs">{truncatedLabel}</span>
        </div>

        {showTooltip && (
          <div className="absolute z-50 -top-2 left-full ml-2 px-3 py-2 text-sm text-white bg-gray-900 rounded shadow-lg max-w-xs whitespace-normal">
            <div className="font-semibold">{data.label}</div>
            <div className="text-gray-400 text-xs">Type: {data.type}</div>
            {data.description && (
              <div className="text-gray-300 text-xs mt-1">{data.description}</div>
            )}
            {data.score && (
              <div className="text-yellow-400 text-xs mt-1">
                Score: {(data.score * 100).toFixed(0)}%
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [highlightedNodes, searchTerm]);

  // Update node types
  const enhancedNodeTypes = useMemo(() => ({
    bubble: EnhancedBubbleNode,
  }), [EnhancedBubbleNode]);

  // Node interaction handlers
  const onNodeClick = useCallback((event, node) => {
    const nodeId = node.id;
    setSelectedNode(nodeId);

    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        // Don't collapse if it would hide everything
        if (newSet.size > 1) {
          newSet.delete(nodeId);
        }
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Search handler
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (!term) {
      setHighlightedNodes(new Set());
      return;
    }

    const highlighted = new Set();
    const searchLower = term.toLowerCase();

    visibleNodes.forEach(node => {
      if (
        node.label.toLowerCase().includes(searchLower) ||
        (node.description && node.description.toLowerCase().includes(searchLower))
      ) {
        highlighted.add(node.id);
      }
    });

    setHighlightedNodes(highlighted);
  }, [visibleNodes]);

  // Filter handler
  const handleFilter = useCallback((type) => {
    setFilterType(type);
  }, []);

  // Reset handler
  const handleReset = useCallback(() => {
    setSearchTerm('');
    setFilterType('all');
    setHighlightedNodes(new Set());
    setExpandedNodes(new Set([rootNodeId]));
    fitView({ padding: 0.2, duration: 800 });
  }, [rootNodeId, fitView]);

  // Filtered nodes based on type
  const filteredFlowNodes = useMemo(() => {
    if (filterType === 'all') return flowNodes;

    return flowNodes.map(node => ({
      ...node,
      hidden: node.data.type !== filterType,
    }));
  }, [flowNodes, filterType]);

  // Stats panel
  const stats = useMemo(() => {
    const typeCount = {};
    visibleNodes.forEach(node => {
      typeCount[node.type] = (typeCount[node.type] || 0) + 1;
    });
    return {
      totalNodes: visibleNodes.length,
      totalEdges: visibleEdges.length,
      byType: typeCount,
    };
  }, [visibleNodes, visibleEdges]);

  // Fit view when nodes change
  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [flowNodes.length, fitView]);

  return (
    <>
      <ReactFlow
        nodes={filteredFlowNodes}
        edges={flowEdges}
        nodeTypes={enhancedNodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background gap={16} color="#374151" variant="dots" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const color = NODE_COLORS[node.data?.type] || NODE_COLORS.default;
            const colorMap = {
              'bg-indigo-600': '#4f46e5',
              'bg-green-600': '#16a34a',
              'bg-yellow-600': '#ca8a04',
              'bg-gray-400': '#9ca3af',
              'bg-purple-600': '#9333ea',
              'bg-pink-600': '#db2777',
              'bg-blue-600': '#2563eb',
              'bg-orange-600': '#ea580c',
              'bg-teal-600': '#0891b2',
              'bg-gray-700': '#374151',
            };
            return colorMap[color] || '#374151';
          }}
          maskColor="rgb(50, 50, 50, 0.8)"
          className="bg-gray-800"
        />
      </ReactFlow>

      {/* Search and Filter Controls */}
      <GraphControls
        onSearch={handleSearch}
        onFilter={handleFilter}
        onReset={handleReset}
      />

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4 bg-gray-800 p-4 rounded-lg shadow-lg">
        <h3 className="text-white font-semibold mb-2">Graph Stats</h3>
        <div className="text-gray-300 text-sm space-y-1">
          <div>Nodes: {stats.totalNodes}</div>
          <div>Edges: {stats.totalEdges}</div>
          <div className="mt-2 pt-2 border-t border-gray-700">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span>{type}:</span>
                <span className="ml-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg">
        <h3 className="text-white font-semibold mb-2">Legend</h3>
        <div className="space-y-1">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            type !== 'default' && type !== 'mentioned_together' && (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${color}`}></div>
                <span className="text-gray-300 text-sm">{type}</span>
              </div>
            )
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700">
          <h4 className="text-gray-400 text-xs mb-1">Relations</h4>
          {Object.entries(EDGE_STYLES).map(([relation, style]) => (
            relation !== 'default' && (
                            <div key={relation} className="flex items-center gap-2 mt-1">
                <div
                  className="w-8 h-0.5"
                  style={{
                    backgroundColor: style.style.stroke,
                    borderStyle: style.style.strokeDasharray ? 'dashed' : 'solid',
                  }}
                />
                <span className="text-gray-300 text-xs">{relation}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </>
  );
}
