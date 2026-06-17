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
      className={`relative bg-black border ${borderColor} min-w-[300px] group transition-colors hover:border-primary/50 rounded-none overflow-visible`}
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)' }}
    >
      {/* Corner Accents */}
      <div className="absolute -top-[1px] -left-[1px] w-8 h-8 border-t-4 border-l-4 border-primary z-20 pointer-events-none" />
      <div className="absolute -bottom-[1px] -right-[1px] w-8 h-8 border-b-4 border-r-4 border-primary z-20 pointer-events-none" />

      {/* Top Header Section */}
      <div className={`p-6 border-b border-border ${isTrigger ? 'bg-primary/5' : 'bg-black/20'}`}>
        {isTrigger ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
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
            <div className="relative w-10 h-10 mb-4 flex items-center justify-center bg-black/40 overflow-hidden">
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
        <div className="flex justify-between items-center px-6 py-4 border-b border-border/50 hover:bg-white/5 transition-colors">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono-data">Type</span>
          <span className="text-[11px] font-mono-data font-bold uppercase tracking-widest text-foreground">
            {data.type ? data.type.toUpperCase() : 'ACTION'}
          </span>
        </div>

        {isTrigger && (
          <div className="flex justify-between items-center px-6 py-4 border-b border-border/50 hover:bg-white/5 transition-colors">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono-data">Schedule</span>
            <span className="text-[11px] font-mono-data font-bold uppercase tracking-widest text-foreground">
              {data.schedule ? data.schedule.mode : 'ON EVENT'}
            </span>
          </div>
        )}

        {data.Prompt && (
          <div className="flex justify-between items-center px-6 py-4 border-b border-border/50 hover:bg-white/5 transition-colors">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono-data">Prompt</span>
            <span
              className="text-[11px] font-mono-data font-bold uppercase tracking-widest text-foreground truncate max-w-[150px] text-right opacity-70"
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
          className="!w-3 !h-5 !bg-primary !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair"
        />
      )}

      {/* Decision: TRUE / FALSE source handles + labels outside the node */}
      {isDecision ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            style={{ top: '30%' }}
            className="!w-3 !h-5 !bg-green-500 !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair"
          />
          <Handle
            id="false"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            style={{ top: '70%' }}
            className="!w-3 !h-5 !bg-orange-500 !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair"
          />

          {/* TRUE label — outside node to the right of the handle */}
          <div
            className="absolute pointer-events-none"
            style={{ right: '-52px', top: '30%', transform: 'translateY(-50%)' }}
          >
            <span className="text-[9px] font-bold text-green-400 font-mono tracking-wider uppercase">
              TRUE
            </span>
          </div>

          {/* FALSE label — outside node to the right of the handle */}
          <div
            className="absolute pointer-events-none"
            style={{ right: '-56px', top: '70%', transform: 'translateY(-50%)' }}
          >
            <span className="text-[9px] font-bold text-orange-400 font-mono tracking-wider uppercase">
              FALSE
            </span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="!w-3 !h-5 !bg-primary !border-2 !border-background !rounded-full z-30 hover:!bg-white hover:!scale-125 transition-all cursor-crosshair"
        />
      )}

      {/* Inline Add Button on Hover */}
      <div className="absolute right-[-32px] top-1/2 -translate-y-1/2 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
        <NodePickerPopover onSelect={handleInlineAdd} side="right" align="center">
          <button
            className="w-6 h-6 bg-card border-2 border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all shadow-lg hover:scale-110 nodrag nopan"
            style={{ fontSize: '14px', lineHeight: 1, fontWeight: 700, cursor: 'pointer' }}
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