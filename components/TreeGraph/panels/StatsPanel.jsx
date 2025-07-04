import React from 'react';

export default function StatsPanel({ stats }) {
  return (
    <div className="absolute bottom-20 left-4 bg-gray-800 p-4 rounded-lg shadow-lg">
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
  );
}
