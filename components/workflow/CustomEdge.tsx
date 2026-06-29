import React, { useId } from 'react';
import { EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';
import { motion, AnimatePresence } from 'motion/react';

interface CustomEdgeData {
  runState?: 'idle' | 'running' | 'success' | 'error';
  branchPath?: 'true' | 'false' | null;
}

export const CustomEdge = ({
  sourceX,
  sourceY,
  sourcePosition,
  sourceHandleId,
  targetX,
  targetY,
  targetPosition,
  data,
  selected,
}: EdgeProps<CustomEdgeData>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const uid = useId().replace(/:/g, '_');
  const pathId = `edge-path-${uid}`;

  const runState: 'idle' | 'running' | 'success' | 'error' = data?.runState || 'idle';

  const branchPath: 'true' | 'false' | null =
    sourceHandleId === 'true' || sourceHandleId === 'false' ? sourceHandleId : null;

  const branchColor =
    branchPath === 'true' ? '#22c55e' :
      branchPath === 'false' ? '#ef4444' :
        '#F49ACB';

  const activeColor = runState === 'error' ? '#ef4444' : branchColor;

  const isRunning = runState === 'running';
  const isSuccess = runState === 'success';
  const isError = runState === 'error';

  return (
    <>
      <defs>
        <path id={pathId} d={edgePath} />
      </defs>

      {/* ── Wide transparent hit-area for mouse interaction ── */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} style={{ cursor: 'grab' }} />

      {/* ── IDLE / SELECTED: slowly flowing dashes ── */}
      {!isRunning && !isSuccess && !isError && (
        <motion.path
          d={edgePath}
          fill="none"
          stroke={activeColor}
          strokeWidth={2}
          strokeDasharray="5 8"
          strokeLinecap="round"
          animate={{ strokeDashoffset: [0, -13] }}
          transition={{ duration: selected ? 0.8 : 1.8, repeat: Infinity, ease: 'linear' }}
          style={{
            pointerEvents: 'none',
            opacity: selected ? 1 : 0.8,
          }}
        />
      )}

      {/* ── ERROR: static red dashes ── */}
      {isError && (
        <path
          d={edgePath}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="5 8"
          strokeLinecap="round"
          opacity={0.8}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* ── SOLID FILLED LINE (Executing or Finished) ── */}
      <AnimatePresence>
        {(isRunning || isSuccess) && (
          <motion.g key="solid-group" exit={{ opacity: 0, transition: { duration: 0.3 } }}>

            {/* Solid line */}
            <motion.path
              d={edgePath}
              fill="none"
              stroke={activeColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ pointerEvents: 'none' }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* ── Branch label ── */}
      <EdgeLabelRenderer>
        {branchPath && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 16}px)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: branchPath === 'true' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${branchPath === 'true' ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)'}`,
                color: branchPath === 'true' ? '#22c55e' : '#ef4444',
                padding: '2px 7px',
                fontSize: '9px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                letterSpacing: '0.12em',
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
