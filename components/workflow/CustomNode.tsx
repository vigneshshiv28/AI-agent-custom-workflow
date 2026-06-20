import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'motion/react';
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

export const CustomNode = memo(({ id, data, isConnectable, selected }: NodeProps) => {
  const logoUrl = getAppLogoUrl(data.label);
  const isTrigger = data.type === 'Trigger';
  const isDecision = data.type === 'Decision';

  const handleInlineAdd = (nodeType: string) => {
    if (data.onAddNodeInline) {
      data.onAddNodeInline(id, nodeType);
    }
  };

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

  const borderColor = selected
    ? 'border-[#F49ACB]/80'
    : isTrigger
      ? 'border-primary/50'
      : isDecision
        ? 'border-yellow-500/40'
        : 'border-white/10';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={`relative bg-black border ${borderColor} min-w-[240px] group transition-colors hover:border-primary/50 rounded-none overflow-visible`}
      style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.5)' }}
    >
      {/* Corner Accents — scaled down */}
      <div className="absolute -top-[1px] -left-[1px] w-5 h-5 border-t-[3px] border-l-[3px] border-primary z-20 pointer-events-none" />
      <div className="absolute -bottom-[1px] -right-[1px] w-5 h-5 border-b-[3px] border-r-[3px] border-primary z-20 pointer-events-none" />

      {/* Header */}
      <div className={`px-4 py-3 border-b border-border ${isTrigger ? 'bg-primary/5' : 'bg-black/20'}`}>
        {isTrigger ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center bg-primary/20 text-primary border border-primary/30 shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-foreground tracking-tight leading-tight">
                Trigger
              </h3>
              <div className="flex items-center gap-1 mt-0.5 text-primary/70">
                <Clock className="w-2.5 h-2.5" />
                <span className={`text-[9px] font-mono uppercase tracking-wider ${!data.schedule ? 'text-muted-foreground/40' : ''}`}>
                  {!data.schedule ? 'No schedule' : scheduleText}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center bg-black/40 shrink-0">
              {isDecision ? (
                <GitBranch className="w-3.5 h-3.5 text-yellow-400" />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Agent Logo"
                  className="w-4 h-4 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-primary">
                  {data.icon || <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary" />}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-foreground tracking-tight leading-tight truncate">
                {data.label}
              </h3>
              {data.description && (
                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono opacity-60 leading-tight truncate max-w-[160px]">
                  {data.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Rows */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center px-4 py-2.5 border-b border-border/50 hover:bg-white/5 transition-colors">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">Type</span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-foreground">
            {data.type ? data.type.toUpperCase() : 'ACTION'}
          </span>
        </div>

        {isTrigger && (
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-border/50 hover:bg-white/5 transition-colors">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">Schedule</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-foreground">
              {data.schedule ? data.schedule.mode : 'NONE'}
            </span>
          </div>
        )}

        {data.Prompt && (
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-border/50 hover:bg-white/5 transition-colors">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">Prompt</span>
            <span
              className="text-[9px] font-mono font-bold uppercase tracking-widest text-foreground truncate max-w-[120px] text-right opacity-70"
              title={data.Prompt}
            >
              {data.Prompt}
            </span>
          </div>
        )}
      </div>

      {/* Target handle */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="!w-3 !h-4 !bg-primary !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair"
        />
      )}

      {/* Decision handles + outside labels */}
      {isDecision ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            style={{ top: '30%' }}
            className="!w-3 !h-4 !bg-green-500 !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair"
          />
          <Handle
            id="false"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            style={{ top: '70%' }}
            className="!w-3 !h-4 !bg-orange-500 !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair"
          />
          {/* Labels outside node */}
          <div className="absolute pointer-events-none" style={{ right: '-44px', top: '30%', transform: 'translateY(-50%)' }}>
            <span className="text-[9px] font-bold text-green-400 font-mono tracking-wider uppercase">TRUE</span>
          </div>
          <div className="absolute pointer-events-none" style={{ right: '-48px', top: '70%', transform: 'translateY(-50%)' }}>
            <span className="text-[9px] font-bold text-orange-400 font-mono tracking-wider uppercase">FALSE</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="!w-3 !h-4 !bg-primary !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair"
        />
      )}

      {/* Inline add button */}
      <div className="absolute right-[-26px] top-1/2 -translate-y-1/2 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
        <NodePickerPopover onSelect={handleInlineAdd} side="right" align="center">
          <button
            className="w-5 h-5 bg-card border-2 border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-150 ease-ui-out shadow-lg hover:scale-110 active:scale-95 nodrag nopan"
            style={{ fontSize: '12px', lineHeight: 1, fontWeight: 700, cursor: 'pointer' }}
            title="Add next node"
          >
            +
          </button>
        </NodePickerPopover>
      </div>
    </motion.div>
  );
});

CustomNode.displayName = 'CustomNode';