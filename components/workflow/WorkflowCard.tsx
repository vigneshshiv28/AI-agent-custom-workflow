import React, { useState } from 'react';
import { Play, Settings, Clock } from 'lucide-react';
import { WorkflowListResponse } from '@/shared/contracts/workflow.contract';
import { WorkflowStatus } from '@/types/components';
import { StatusBadge } from './StatusBadge';
import { motion } from 'motion/react';

interface WorkflowCardProps {
  workflow: WorkflowListResponse;
  onRun: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, onRun, onEdit, onDelete }) => {
  const [runState, setRunState] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (runState !== 'idle') return;

    setRunState('running');

    // Simulate execution
    setTimeout(() => {
      // 80% success, 20% error for demonstration
      const isError = Math.random() > 0.8;
      setRunState(isError ? 'error' : 'success');

      setTimeout(() => {
        setRunState('idle');
      }, 2000);
    }, 2500);

    onRun(workflow.id);
  };

  const lastRunStr = workflow.Executions && workflow.Executions.length > 0
    ? new Date(workflow.Executions[0].startedAt).toLocaleString()
    : 'Never';

  return (
    <motion.div
      className="group relative bg-card rounded-lg shadow-premium hover:shadow-premium-hover transition-all duration-300 flex flex-col h-full hover:scale-[1.01] overflow-hidden"
      animate={
        runState === 'error' ? { x: [-2, 2, -2, 2, 0], transition: { duration: 0.3 } } :
          runState === 'success' ? { scale: [1, 1.02, 1], transition: { duration: 0.3 } } :
            {}
      }
    >

      <div className="absolute inset-0 bg-matte-gradient opacity-100 pointer-events-none" />
      <div className="absolute inset-0 shadow-inner-glow rounded-lg pointer-events-none" />

      <div className="absolute inset-0 rounded-lg border border-white/10 pointer-events-none group-hover:border-white/20 transition-colors" />


      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{
          opacity: runState === 'running' ? 1 : 0,
          boxShadow: runState === 'running' ? 'inset 0 0 20px rgba(255,255,255,0.05), 0 0 15px rgba(255,255,255,0.1)' : 'none'
        }}
        transition={{ duration: 0.3 }}
      >

        <div
          className="absolute inset-0 blur-[4px] rounded-lg"
          style={{
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        >
          <motion.div
            className="absolute w-[300%] h-[300%] top-[-100%] left-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              background: 'conic-gradient(from 90deg at 50% 50%, transparent 75%, var(--color-primary) 95%, var(--color-primary) 100%)',
            }}
          />
        </div>

        <div
          className="absolute inset-0 rounded-lg"
          style={{
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        >
          <motion.div
            className="absolute w-[300%] h-[300%] top-[-100%] left-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              background: 'conic-gradient(from 90deg at 50% 50%, transparent 75%, var(--color-primary) 95%, #ffffff 100%)',
            }}
          />
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 rounded-lg border border-emerald-500/50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: runState === 'success' ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        className="absolute inset-0 rounded-lg border border-red-500/50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: runState === 'error' ? [0, 1, 0, 1, 0] : 0 }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative z-10 flex flex-col h-full p-8"> {/* Increased padding */}
        <div className="flex justify-between items-start mb-8">
          <StatusBadge
            status={
              workflow.Schedules?.[0]?.status === 'ACTIVE'
                ? WorkflowStatus.Active
                : workflow.Schedules?.[0]?.status === 'PAUSED'
                  ? WorkflowStatus.Paused
                  : WorkflowStatus.Error
            }
            runState={runState}
          />
          <button
            onClick={() => onEdit(workflow.id)}
            className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-8 text-sm text-muted-foreground">
          <div className="flex gap-4">
            <span><strong>{workflow._count?.Executions || 0}</strong> Executions</span>
            <span><strong>{workflow._count?.Schedules || 0}</strong> Schedules</span>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex justify-between items-center mt-auto">
          <div className="flex items-center text-xs font-medium text-muted-foreground/70">
            <Clock className="w-3.5 h-3.5 mr-2" />
            Last run: {lastRunStr}
          </div>

          <button
            onClick={handleRun}
            disabled={runState !== 'idle'}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all flex items-center tracking-wide uppercase ${runState !== 'idle'
              ? 'text-muted-foreground bg-white/5 cursor-not-allowed'
              : 'text-primary hover:text-primary-foreground hover:bg-primary/10'
              }`}>
            {runState === 'running' ? 'Running...' : 'Run'}
            <Play className="w-3 h-3 ml-2 fill-current" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};