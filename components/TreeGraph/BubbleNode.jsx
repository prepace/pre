"use client";

import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NODE_COLORS } from './utils/constants';

export default function BubbleNode({ data, selected }) {
    const baseColor = NODE_COLORS[data.type] || NODE_COLORS.default;
    const isHighlighted = data.highlightedNodes && data.highlightedNodes.has(data.id);
    const [showTooltip, setShowTooltip] = useState(false);

    // Use originalLabel if available (for display), otherwise use label
    const displayLabel = data.originalLabel || data.label;

    // For truncation, prioritize showing the most important part
    let truncatedLabel = displayLabel;
    if (displayLabel.length > 15) {
        // For email addresses, show the username part
        if (data.type === 'EMAIL' && displayLabel.includes('@')) {
            const username = displayLabel.split('@')[0];
            truncatedLabel = username.length > 12 ? username.slice(0, 9) + '...' : username + '@...';
        }
        // For IDENTITY nodes, remove the " (Identity)" suffix for display
        else if (data.type === 'IDENTITY' && displayLabel.includes(' (Identity)')) {
            const name = displayLabel.replace(' (Identity)', '');
            truncatedLabel = name.length > 12 ? name.slice(0, 9) + '...' : name;
        }
        // Default truncation
        else {
            truncatedLabel = displayLabel.slice(0, 12) + '...';
        }
    }

    return (
        <div className="relative">
            {/* Input handle - where edges connect TO this node */}
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    background: '#555',
                    width: 8,
                    height: 8,
                    border: '2px solid #fff',
                    left: -4,
                }}
            />

            <div
                className={`
                    select-none rounded-full text-white font-semibold
                    ${baseColor}
                    cursor-pointer
                    flex items-center justify-center text-center
                    h-24 w-24 p-2
                    transition-all duration-200
                    ${selected ? 'scale-110 ring-4 ring-indigo-400' : 'hover:scale-105'}
                    ${isHighlighted ? 'ring-4 ring-yellow-400' : ''}
                    shadow-lg
                    ${!isHighlighted && data.searchTerm ? 'opacity-30' : ''}
                `}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <span className="text-xs break-words">{truncatedLabel}</span>
            </div>

            {/* Output handle - where edges connect FROM this node */}
            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: '#555',
                    width: 8,
                    height: 8,
                    border: '2px solid #fff',
                    right: -4,
                }}
            />

            {showTooltip && (
                <div className="absolute z-50 -top-2 left-full ml-4 px-3 py-2 text-sm text-white bg-gray-900 rounded shadow-lg max-w-xs whitespace-normal">
                    <div className="font-semibold break-all">{displayLabel}</div>
                    <div className="text-gray-400 text-xs">Type: {data.type}</div>
                    {data.description && (
                        <div className="text-gray-300 text-xs mt-1 break-words">{data.description}</div>
                    )}
                    {data.score && (
                        <div className="text-yellow-400 text-xs mt-1">
                            Score: {(data.score * 100).toFixed(0)}%
                        </div>
                    )}
                    {/* Show sanitized ID if different from display label (for debugging) */}
                    {process.env.NODE_ENV === 'development' && data.id !== displayLabel && (
                        <div className="text-gray-500 text-xs mt-1 font-mono">
                            ID: {data.id}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
