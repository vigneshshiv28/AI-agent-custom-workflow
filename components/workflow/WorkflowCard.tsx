import React, { useState } from 'react';
import { WorkflowListResponse } from '@/shared/contracts/workflow.contract';

interface WorkflowCardProps {
  workflow: WorkflowListResponse;
  onRun: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatRelativeTime(dateInput: Date | string | number) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `Just now`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return `Yesterday`;
  return `${days} days ago`;
}

function formatDateToTime(dateInput: Date | string | number) {
  const date = new Date(dateInput);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === date.toDateString();
  
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today ${timeStr}`;
  if (isTomorrow) return `Tomorrow ${timeStr}`;
  return `${date.toLocaleDateString()} ${timeStr}`;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Workflow Graph Preview Logic
  const nodes = workflow.workflow?.graph?.nodes || [];
  const edges = workflow.workflow?.graph?.edges || [];
  
  let graphPreview = 'Empty Workflow';
  if (nodes.length > 0) {
    const triggerNode = nodes.find((n: any) => n.type === 'Trigger' || n.data?.type === 'Trigger') || nodes[0];
    
    const buildPath = (nodeId: string, depth = 0): string => {
      if (depth > 5) return '...';
      const node = nodes.find((n: any) => n.id === nodeId);
      if (!node) return '';
      
      const label = node.data?.label || node.type || 'Node';
      const outgoingEdges = edges.filter((e: any) => e.source === nodeId);
      
      if (outgoingEdges.length === 0) return label;
      if (outgoingEdges.length === 1) return `${label} → ${buildPath(outgoingEdges[0].target, depth + 1)}`;
      
      const branches = outgoingEdges.map((e: any) => buildPath(e.target, depth + 1)).join(', ');
      return `${label} → [${branches}]`;
    };
    
    graphPreview = buildPath(triggerNode.id);
  }

  // Activity Indicator Logic
  let dotColor = 'transparent';
  let dotBorder = '#404046';
  let activityText = 'Never Executed';
  
  const activeSchedule = workflow.Schedules?.find(s => s.status === 'ACTIVE');
  const latestExecution = workflow.Executions && workflow.Executions.length > 0 ? workflow.Executions[0] : null;

  if (activeSchedule) {
    dotColor = '#60A5FA'; // Default blue for scheduled
    dotBorder = '#60A5FA';
    const nextRunStr = activeSchedule.nextRunAt ? formatDateToTime(activeSchedule.nextRunAt) : 'Unknown';
    activityText = `Scheduled · Next run ${nextRunStr}`;
  } else if (latestExecution) {
    const timeStr = formatRelativeTime(latestExecution.startedAt);
    if (latestExecution.status === 'RUNNING') {
      dotColor = '#4ADE80';
      dotBorder = '#4ADE80';
      activityText = `Running since ${timeStr}`;
    } else if (latestExecution.status === 'FAILED') {
      dotColor = '#F87171';
      dotBorder = '#F87171';
      activityText = `Failed ${timeStr}`;
    } else if (latestExecution.status === 'SUCCESS') {
      dotColor = '#60A5FA';
      dotBorder = '#60A5FA';
      activityText = `Executed ${timeStr}`;
    }
  }

  return (
    <div
      onClick={() => onEdit(workflow.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col cursor-pointer transition-colors duration-150 relative border"
      style={{
        padding: '20px',
        borderRadius: '0px',
        backgroundColor: '#161618',
        borderColor: isHovered ? '#404046' : '#26262B'
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[15px] font-semibold text-[#FAFAFA] tracking-tight">
          {workflow.name}
        </h3>
      </div>
      
      <div className="mb-6 font-mono text-[13px] text-[#A1A1AA] leading-relaxed line-clamp-3">
        {graphPreview}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full border shrink-0" 
          style={{ backgroundColor: dotColor, borderColor: dotBorder }}
        />
        <span className="text-[13px] text-[#A1A1AA] truncate">
          {activityText}
        </span>
      </div>
    </div>
  );
};