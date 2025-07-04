export default function calculateTreeLayout(nodes, edges, rootId) {
  if (!rootId || nodes.length === 0) return { nodes, edges };

  const childrenMap = new Map();
  const parentMap = new Map();

  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source).push(edge.target);
    parentMap.set(edge.target, edge.source);
  });

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

  const depthGroups = new Map();
  nodes.forEach(node => {
    const depth = depths.get(node.id) ?? 0;
    if (!depthGroups.has(depth)) {
      depthGroups.set(depth, []);
    }
    depthGroups.get(depth).push(node);
  });

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
}
