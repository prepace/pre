import React from 'react';
import { NODE_COLORS, EDGE_STYLES } from '../utils/constants';

export default function LegendPanel() {
    return (
        <div className="absolute top-20 right-0 bg-gray-800 p-4 rounded-lg shadow-lg">
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
    );
}
