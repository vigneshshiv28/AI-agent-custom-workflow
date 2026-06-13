import React from 'react';
import { WorkflowStatus } from '@/types/components';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Check, X } from 'lucide-react';

interface StatusBadgeProps {
  status: WorkflowStatus;
  runState?: 'idle' | 'running' | 'success' | 'error';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, runState = 'idle' }) => {
  const styles = {
    [WorkflowStatus.Active]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    [WorkflowStatus.Paused]: "bg-zinc-700/30 text-zinc-400 border-zinc-700/50",
    [WorkflowStatus.Error]: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const dotColors = {
    [WorkflowStatus.Active]: "bg-emerald-400",
    [WorkflowStatus.Paused]: "bg-zinc-400",
    [WorkflowStatus.Error]: "bg-red-400",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold border ${styles[status]} transition-all duration-300`}>
      <span className="relative flex h-1.5 w-1.5 mr-1.5">
        <AnimatePresence>
          {runState === 'running' && (
            <motion.span 
              className={`absolute inline-flex h-full w-full rounded-full ${dotColors[status]}`}
              animate={{ scale: [1, 2], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[status]}`}></span>
      </span>
      {status}
      
      <AnimatePresence mode="wait">
        {runState === 'running' && (
          <motion.div
            key="loader"
            initial={{ opacity: 0, width: 0, marginLeft: 0, scale: 0.5 }}
            animate={{ opacity: 1, width: 12, marginLeft: 6, scale: 1 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-3 h-3 text-current opacity-70" />
            </motion.div>
          </motion.div>
        )}
        {runState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, width: 0, marginLeft: 0, scale: 0.5 }}
            animate={{ opacity: 1, width: 12, marginLeft: 6, scale: 1 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <Check className="w-3 h-3 text-emerald-400" />
          </motion.div>
        )}
        {runState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, width: 0, marginLeft: 0, scale: 0.5 }}
            animate={{ opacity: 1, width: 12, marginLeft: 6, scale: 1 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <X className="w-3 h-3 text-red-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};