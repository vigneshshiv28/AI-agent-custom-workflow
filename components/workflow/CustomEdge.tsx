import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';
import { motion } from 'motion/react';

export const CustomEdge = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const runState = data?.runState || 'idle';

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={20}
        style={{
          ...style,
          stroke: 'oklch(0.75 0.18 330 / 0.3)',
          strokeWidth: 2,
          cursor: 'grab'
        }}
      />
      <motion.path
        d={edgePath}
        fill="none"
        stroke="oklch(0.75 0.18 330)"
        strokeWidth={3}
        pathLength="1"
        initial={{ strokeDasharray: "1 1", strokeDashoffset: 1, opacity: 0 }}
        animate={{ 
          strokeDashoffset: runState === 'running' || runState === 'success' ? 0 : 1,
          opacity: runState === 'idle' ? 0 : 1
        }}
        transition={{ duration: 1, ease: "linear" }}
        style={{ animation: 'none' }}
      />
    </>
  );
};
