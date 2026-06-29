import React, { useState } from 'react';
import { Trash2, Zap, GitBranch } from 'lucide-react';
import { WorkflowListResponse } from '@/shared/contracts/workflow.contract';
import { IntegrationIcon } from '@/components/icons/integration-icons';

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
    'calendar': 'calendar.google.com',
    'google-calendar': 'calendar.google.com',
  };

  for (const [app, domain] of Object.entries(domainMap)) {
    if (lowerLabel.includes(app)) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }
  return null;
};

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

export const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Workflow Graph Preview Logic
  const nodes = workflow.workflow?.graph?.nodes || [];
  const edges = workflow.workflow?.graph?.edges || [];
  
  if (nodes.length > 0) {
    const triggerNode = nodes.find((n: any) => n.type === 'Trigger' || n.data?.type === 'Trigger') || nodes[0];
  }

  const uniqueNodes: any[] = [];
  const seenNodes = new Set();
  nodes.forEach((n: any) => {
    const type = n.data?.type || n.type;
    const label = n.data?.label || 'unnamed';
    const key = type + '-' + label;
    if (!seenNodes.has(key)) {
      seenNodes.add(key);
      uniqueNodes.push(n);
    }
  });

  // Activity Indicator Logic
  let dotColor = 'transparent';
  let dotBorder = 'var(--color-steel)';
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
      activityText = `Last run ${timeStr}`;
    }
  }

  return (
    <div
      onClick={() => onEdit(workflow.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col cursor-pointer transition-all duration-150 ease-ui-out active:scale-[0.98] relative border"
      style={{
        padding: '20px',
        borderRadius: '0px',
        backgroundColor: 'var(--color-obsidian)',
        borderColor: isHovered ? 'var(--color-steel)' : 'var(--color-graphite)'
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-[15px] font-semibold text-snow tracking-tight">
          {workflow.name}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full border shrink-0" 
              style={{ backgroundColor: dotColor, borderColor: dotBorder }}
            />
            <span className="text-[13px] text-fog truncate">
              {activityText}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(workflow.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-fog hover:text-[#F87171] hover:bg-[#F87171]/10 transition-all rounded"
            title="Delete workflow"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-nowrap items-center gap-2 mb-6 overflow-hidden">
        {(() => {
          const apps = uniqueNodes.filter(n => {
            const isIntegration = ['gmail', 'google-calendar', 'notion', 'google-drive'].includes(n.data?.type);
            const hasLogo = !!getAppLogoUrl(n.data?.label || n.data?.type);
            const isTrigger = n.type === 'Trigger' || n.data?.type === 'Trigger';
            return isIntegration || hasLogo || isTrigger;
          });

          const maxApps = 5;
          const displayApps = apps.slice(0, maxApps);
          const remaining = apps.length - maxApps;

          return (
            <>
              {displayApps.map((n, i) => {
                const isTrigger = n.type === 'Trigger' || n.data?.type === 'Trigger';
                const logoUrl = getAppLogoUrl(n.data?.label || n.data?.type);
                const isIntegration = ['gmail', 'google-calendar', 'notion', 'google-drive'].includes(n.data?.type);
                
                return (
                  <div 
                    key={i} 
                    className="w-7 h-7 rounded-full bg-[#111113] border border-[#26262B] flex items-center justify-center shrink-0 shadow-sm" 
                    title={n.data?.type || n.data?.label || 'App'}
                  >
                    {isTrigger ? (
                      <Zap className="w-3.5 h-3.5 text-snow" fill="currentColor" />
                    ) : isIntegration ? (
                      <IntegrationIcon provider={n.data?.type} className="w-4 h-4" />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="logo" className="w-4 h-4 object-contain rounded-sm" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F49ACB]/50 border border-[#F49ACB]" />
                    )}
                  </div>
                );
              })}
              {remaining > 0 && (
                <div 
                  className="w-7 h-7 rounded-full bg-[#111113] border border-[#26262B] flex items-center justify-center shrink-0 shadow-sm text-iron text-[11px] font-bold"
                  title={`${remaining} more apps`}
                >
                  ...
                </div>
              )}
            </>
          );
        })()}
      </div>

      <div className="mt-auto text-[13px] text-fog">
        Last updated: {new Date(workflow.updatedAt || workflow.createdAt || Date.now()).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};