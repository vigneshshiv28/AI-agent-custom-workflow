import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'motion/react';
import { StatusBadge } from './StatusBadge';
import { WorkflowStatus } from '@/types/components';
import { Zap, Clock, GitBranch } from 'lucide-react';
import { NodePickerPopover } from './NodePickerPopover';

const getAppLogoUrl = (label: string) => {
  if (!label) return null;
  const lowerLabel = label.toLowerCase();
  const domainMap: Record<string, string> = {
    'gmail': 'gmail.com',
    'slack': 'slack.com',
    'zoom': 'zoom.us',
    'mail': 'icloud.com',
    'sheets': 'docs.google.com',
    'drive': 'drive.google.com',
    'jira': 'jira.atlassian.com',
    'zendesk': 'zendesk.com',
    'gemini': 'gemini.google.com',
    'quickbooks': 'quickbooks.intuit.com',
    'notion': 'notion.so',
    'twitter': 'twitter.com',
  };

  for (const [app, domain] of Object.entries(domainMap)) {
    if (lowerLabel.includes(app)) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }
  return null;
};

export const CustomNode = memo(({ id, data, isConnectable }: NodeProps) => {
  const logoUrl = getAppLogoUrl(data.label);
  const runState = data.runState || 'idle';
  const isTrigger = data.type === 'Trigger';
  const isDecision = data.type === 'Decision';

  let scheduleText = 'Not scheduled';
  if (isTrigger && data.schedule) {
    if (data.schedule.mode === 'INTERVAL') {
      scheduleText = `Every ${data.schedule.value} ${data.schedule.unit.toLowerCase()}`;
      if (data.schedule.time) scheduleText += ` at ${data.schedule.time}`;
    } else if (data.schedule.mode === 'CRON') {
      scheduleText = `Cron: ${data.schedule.cronExpression}`;
    } else if (data.schedule.mode === 'CALENDAR') {
      scheduleText = `At: ${new Date(data.schedule.dateTime).toLocaleString()}`;
    }
  }

  const handleInlineAdd = (nodeType: string) => {
    if (data.onAddNodeInline) {
      data.onAddNodeInline(id, nodeType);
    }
  };

  return (
    <motion.div 
      className={`relative bg-black border ${isTrigger ? 'border-primary/50' : isDecision ? 'border-yellow-500/40' : 'border-white/10'} min-w-[300px] shadow-[0_10px_40px_rgba(0,0,0,0.8)] group transition-all hover:border-primary/50 rounded-none overflow-visible`}
      animate={
        runState === 'error' ? { x: [-2, 2, -2, 2, 0], transition: { duration: 0.3 } } :
        runState === 'success' ? { scale: [1, 1.02, 1], transition: { duration: 0.3 } } :
        {}
      }
    >
      {/* Active Flowing Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden z-10"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: runState === 'running' ? 1 : 0,
          boxShadow: runState === 'running' ? 'inset 0 0 20px rgba(255,255,255,0.05), 0 0 15px rgba(255,255,255,0.1)' : 'none'
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Glow */}
        <div 
          className="absolute inset-0 blur-[4px]"
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
        {/* Core */}
        <div 
          className="absolute inset-0"
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

      {/* Success Border */}
      <motion.div
        className="absolute inset-0 border-2 border-emerald-500/50 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: runState === 'success' ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Error Border */}
      <motion.div
        className="absolute inset-0 border-2 border-red-500/50 pointer-events-none z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: runState === 'error' ? [0, 1, 0, 1, 0] : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Corner Accents */}
      <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-4 border-l-4 border-primary z-20 pointer-events-none" />
      <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-4 border-r-4 border-primary z-20 pointer-events-none" />

      {/* Top Header Section */}
      <div className={`p-6 border-b border-border ${isTrigger ? 'bg-primary/5' : 'bg-black/20'}`}>
        {isTrigger ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-primary/20 text-primary rounded-lg border border-primary/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground tracking-tight leading-tight">
                  Trigger
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-primary/80">
                  <Clock className="w-3 h-3" />
                  <span className={`text-[10px] font-mono-data uppercase tracking-wider ${!data.schedule ? 'text-muted-foreground/40' : ''}`}>
                    {!data.schedule ? 'No schedule' : scheduleText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative w-10 h-10 mb-4 flex items-center justify-center bg-black/40 rounded-lg overflow-hidden">
              {isDecision ? (
                <GitBranch className="w-5 h-5 text-yellow-400" />
              ) : logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Agent Logo" 
                  className="w-6 h-6 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-primary">
                  {data.icon || <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary" />}
                </div>
              )}
            </div>
            <h3 className="text-xl font-semibold text-foreground tracking-tight leading-tight">
              {data.label}
            </h3>
            {data.description && (
              <p className="text-xs text-muted-foreground mt-2 font-mono-data opacity-70 leading-relaxed">
                {data.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* Data Rows Section */}
      <div className="flex flex-col">
        {!isTrigger && (
          <div className="flex justify-between items-center px-6 py-3 border-b border-border/50 hover:bg-white/5 transition-colors">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono-data">Type</span>
            <span className="text-xs font-mono-data text-foreground">{data.type || 'Action'}</span>
          </div>
        )}
        <div className="flex justify-between items-center px-6 py-3 border-b border-border/50 hover:bg-white/5 transition-colors">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono-data">Status</span>
          <StatusBadge status={WorkflowStatus.Active} runState={runState} />
        </div>
        {data.Prompt && (
          <div className="flex justify-between items-center px-6 py-3 border-b border-border/50 hover:bg-white/5 transition-colors">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono-data">Prompt</span>
            <span className="text-xs font-mono-data text-foreground truncate max-w-[150px] text-right opacity-70" title={data.Prompt}>{data.Prompt}</span>
          </div>
        )}
      </div>

      {data.type !== 'Trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="!w-4 !h-6 !bg-primary !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair shadow-[0_0_8px_rgba(255,0,128,0.4)]"
        />
      )}
      
      {isDecision ? (
        /* Decision node: two output handles — True (top-right) and False (bottom-right) */
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            style={{ top: '30%' }}
            className="!w-4 !h-6 !bg-green-500 !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair shadow-[0_0_8px_rgba(34,197,94,0.5)]"
          />
          <Handle
            id="false"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            style={{ top: '70%' }}
            className="!w-4 !h-6 !bg-orange-500 !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair shadow-[0_0_8px_rgba(249,115,22,0.5)]"
          />
          {/* Labels for handles */}
          <div className="absolute right-5 top-[28%] -translate-y-1/2 text-[8px] font-bold text-green-400 font-mono tracking-wider pointer-events-none">TRUE</div>
          <div className="absolute right-5 top-[72%] -translate-y-1/2 text-[8px] font-bold text-orange-400 font-mono tracking-wider pointer-events-none">FALSE</div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="!w-4 !h-6 !bg-primary !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair shadow-[0_0_8px_rgba(255,0,128,0.4)]"
        />
      )}

      {/* Inline Add Node Button — appears on hover */}
      {data.onAddNodeInline && (
        <NodePickerPopover onSelect={handleInlineAdd} side="right" align="center" />
      )}
    </motion.div>
  );
});

CustomNode.displayName = 'CustomNode';