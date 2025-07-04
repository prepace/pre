export const NODE_COLORS = {
  IDENTITY: 'bg-indigo-600',
  PERSON: 'bg-green-600',
  ADDRESS: 'bg-yellow-600',
  CARDINAL: 'bg-gray-400',
  PHONE: 'bg-purple-600',
  EMAIL: 'bg-pink-600',
  Letter: 'bg-blue-600',
  DATE: 'bg-orange-600',
  LOCATION: 'bg-teal-600',
  mentioned_together: 'bg-blue-600',
  default: 'bg-gray-700',
};

export const EDGE_STYLES = {
  mentioned_together: {
    animated: true,
    style: { stroke: '#60a5fa', strokeWidth: 2 },
    markerEnd: { type: 'arrow', color: '#60a5fa' },
  },
  IS_NAME: {
    animated: false,
    style: { stroke: '#a78bfa', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: 'arrowclosed', color: '#a78bfa' },
  },
  HAS_ADDRESS: {
    animated: false,
    style: { stroke: '#fbbf24', strokeWidth: 1.5 },
    markerEnd: { type: 'arrow', color: '#fbbf24' },
  },
  HAS_PHONE: {
    animated: false,
    style: { stroke: '#c084fc', strokeWidth: 1.5 },
    markerEnd: { type: 'arrow', color: '#c084fc' },
  },
  HAS_EMAIL: {
    animated: false,
    style: { stroke: '#f472b6', strokeWidth: 1.5 },
    markerEnd: { type: 'arrow', color: '#f472b6' },
  },
  wrote: {
    animated: false,
    style: { stroke: '#10b981', strokeWidth: 2 },
    markerEnd: { type: 'arrow', color: '#10b981' },
  },
  sent_to: {
    animated: false,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    markerEnd: { type: 'arrow', color: '#3b82f6' },
  },
  default: {
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 1 },
    markerEnd: { type: 'arrow', color: '#6b7280' },
  },
};
