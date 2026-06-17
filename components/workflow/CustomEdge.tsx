import React, { useId } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';
import { motion, AnimatePresence } from 'motion/react';

interface CustomEdgeData {
  runState?: 'idle' | 'running' | 'success' | 'error';
  branchPath?: 'true' | 'false' | null;
}

export const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  sourceHandleId,
  targetX,
  targetY,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps<CustomEdgeData>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const uid = useId();
  const pathId = `edge-path-${uid}`;

  const runState: 'idle' | 'running' | 'success' | 'error' = data?.runState || 'idle';

  // Branch identity from sourceHandleId
  const branchPath: 'true' | 'false' | null =
    sourceHandleId === 'true' || sourceHandleId === 'false'
      ? sourceHandleId
      : null;

  // Color per branch — hex only, oklch is unreliable in SVG stroke attributes
  const branchColor =
    branchPath === 'true'
      ? '#22c55e'
      : branchPath === 'false'
        ? '#f97316'
        : '#d17bb5';

  const activeColor =
    runState === 'error' ? '#ef4444' : branchColor;

  const baseOpacity =
    selected
      ? 0.8
      : runState === 'idle'
        ? 0.22
        : runState === 'error'
          ? 0.8
          : 0.4;

  return (
    <>
      {/* Path def for animateMotion */}
      <defs>
        <path id={pathId} d={edgePath} />
      </defs>

      {/* Static base track */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={20}
        style={{
          ...style,
          stroke: activeColor,
          strokeWidth: 3.5,
          opacity: baseOpacity,
          cursor: 'grab',
          transition: 'opacity 0.4s, stroke 0.3s',
        }}
      />

      {/* Running: animated marching dashes */}
      <AnimatePresence>
        {runState === 'running' && (
          <motion.path
            key="running-dashes"
            d={edgePath}
            fill="none"
            stroke={activeColor}
            strokeWidth={3}
            strokeDasharray="6 10"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 0, opacity: 0 }}
            animate={{ strokeDashoffset: -16, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{
              strokeDashoffset: { duration: 0.4, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 0.15 },
            }}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>

      {/* Success: path sweep from source to target */}
      <AnimatePresence>
        {runState === 'success' && (
          <motion.path
            key="success-sweep"
            d={edgePath}
            fill="none"
            stroke={activeColor}
            strokeWidth={5}
            strokeLinecap="round"
            pathLength="1"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 1, 0.3] }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{
              pathLength: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 1.0, times: [0, 0.5, 1] },
            }}
            style={{
              pointerEvents: 'none',
              filter: `drop-shadow(0 0 4px ${activeColor})`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Success: glowing dot traveling along the path */}
      <AnimatePresence>
        {runState === 'success' && (
          <motion.g
            key="success-particle"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, times: [0, 0.1, 0.8, 1], ease: 'easeOut' }}
            style={{ pointerEvents: 'none' }}
          >
            <circle r={7} fill={activeColor} opacity={0.3}>
              <animateMotion dur="0.6s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1">
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
            <circle r={4} fill={activeColor}>
              <animateMotion dur="0.6s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1">
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
            <circle r={2} fill="white" opacity={0.9}>
              <animateMotion dur="0.6s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1">
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Branch label — rendered outside SVG via EdgeLabelRenderer */}
      <EdgeLabelRenderer>
        {branchPath && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 18}px)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: branchPath === 'true'
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(249,115,22,0.12)',
                border: `1px solid ${branchPath === 'true' ? 'rgba(34,197,94,0.5)' : 'rgba(249,115,22,0.5)'}`,
                color: branchPath === 'true' ? '#22c55e' : '#f97316',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '9px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(4px)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {branchPath}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};
