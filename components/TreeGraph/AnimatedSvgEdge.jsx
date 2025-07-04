import React from "react";
import {
  BaseEdge,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
} from "@xyflow/react";

/**
 * The `AnimatedSvgEdge` component renders a React Flow edge
 * and animates a 3D-styled tetrahedron shape along the path.
 */
export default function AnimatedSvgEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {
    duration: 2,
    direction: "forward",
    path: "bezier",
    repeat: "indefinite",
    shape: "tetrahedron",
  },
  ...delegated
}) {
  const Shape = shapes[data.shape] || shapes.circle;

  const [path] = getPath({
    type: data.path ?? "bezier",
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const animateMotionProps = getAnimateMotionProps({
    duration: data.duration,
    direction: data.direction ?? "forward",
    repeat: data.repeat ?? "indefinite",
    path,
  });

  return (
    <>
      <BaseEdge id={id} path={path} {...delegated} />
      <Shape animateMotionProps={animateMotionProps} />
    </>
  );
}

const shapes = {
  circle: ({ animateMotionProps }) => (
    <circle r="5" fill="#ff0073">
      <animateMotion {...animateMotionProps} />
    </circle>
  ),

  package: ({ animateMotionProps }) => (
    <g fill="#dfc7b1" stroke="#2b2a2a" transform="translate(-10,-10)">
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
      <path d="m7.5 4.27 9 5.15" />
      <animateMotion {...animateMotionProps} />
    </g>
  ),

  tetrahedron: ({ animateMotionProps }) => (
    <g transform="translate(-10, -10)">
      {/* Bottom face */}
      <polygon
        points="10,0 0,17.32 20,17.32"
        fill="#fde68a"
        stroke="#78350f"
        strokeWidth={1.5}
        opacity={0.85}
      />
      {/* Side face 1 */}
      <polygon
        points="10,0 0,17.32 10,10"
        fill="#fcd34d"
        stroke="#78350f"
        strokeWidth={1}
        opacity={0.9}
      />
      {/* Side face 2 */}
      <polygon
        points="10,0 20,17.32 10,10"
        fill="#fbbf24"
        stroke="#78350f"
        strokeWidth={1}
        opacity={0.9}
      />
      {/* "Motion" */}
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 10 10"
        to="360 10 10"
        dur="6s"
        repeatCount="indefinite"
      />
      <animateMotion {...animateMotionProps} />
    </g>
  ),
};

/**
 * Return the correct edge path type based on the config.
 */
function getPath({
  type,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  switch (type) {
    case "bezier":
      return getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });
    case "smoothstep":
      return getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });
    case "step":
      return getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        borderRadius: 0,
      });
    case "straight":
      return getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
  }
}

/**
 * Construct <animateMotion /> config.
 */
function getAnimateMotionProps({ duration, direction, repeat, path }) {
  const base = {
    path,
    repeatCount: repeat,
    calcMode: "linear",
  };

  switch (direction) {
    case "forward":
      return {
        ...base,
        dur: `${duration}s`,
        keyTimes: "0;1",
        keyPoints: "0;1",
      };
    case "reverse":
      return {
        ...base,
        dur: `${duration}s`,
        keyTimes: "0;1",
        keyPoints: "1;0",
      };
    case "alternate":
      return {
        ...base,
        dur: `${duration * 2}s`,
        keyTimes: "0;0.5;1",
        keyPoints: "0;1;0",
      };
    case "alternate-reverse":
      return {
        ...base,
        dur: `${duration * 2}s`,
        keyTimes: "0;0.5;1",
        keyPoints: "1;0;1",
      };
  }
}
