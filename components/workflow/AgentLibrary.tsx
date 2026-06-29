"use client";
import React, { useState, useCallback } from "react";
import { Zap, GitBranch, Cloud, FileText, Search } from "lucide-react";
import NotionIcon from "@/components/icons/notion";
import * as Popover from "@radix-ui/react-popover";
import { GoogleCalendarIcon, GoogleDriveIcon, GmailIcon } from "@/components/icons/integration-icons";


export interface AgentDef {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isSystem?: boolean;
}

export const AGENTS: AgentDef[] = [
  {
    type: "Decision",
    label: "Decision",
    description: "Branch based on a condition",
    icon: <GitBranch className="w-3.5 h-3.5" />,
    isSystem: true,
  },
  {
    type: "notion",
    label: "Notion",
    description: "Read and write Notion pages",
    icon: <NotionIcon width={14} height={14} />,
  },
  {
    type: "gmail",
    label: "Gmail",
    description: "Send and read emails",
    icon: <GmailIcon className="w-3.5 h-3.5" />,
  },
  {
    type: "google-calendar",
    label: "Google Calendar",
    description: "Manage calendar events",
    icon: <GoogleCalendarIcon className="w-3.5 h-3.5" />,
  },
  {
    type: "google-drive",
    label: "Google Drive",
    description: "Manage files and folders",
    icon: <GoogleDriveIcon className="w-3.5 h-3.5" />,
  },
];

function useFilteredAgents(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return AGENTS;
  return AGENTS.filter(
    (a) =>
      a.label.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
  );
}


interface AgentRowProps {
  agent: AgentDef;
  onSelect: (type: string) => void;
  draggable?: boolean;
}

function AgentRow({ agent, onSelect, draggable = false }: AgentRowProps) {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("application/agentflow-type", agent.type);
    },
    [agent.type]
  );

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onClick={() => onSelect(agent.type)}
      title={draggable ? "Drag to canvas or click to add" : undefined}
      className={`group flex items-center gap-3 px-3 py-2.5 ${draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:bg-white/[0.04] transition-colors duration-100 select-none`}
      style={{ borderBottom: "1px solid var(--color-obsidian)" }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(agent.type)}
    >
      {/* Icon */}
      <div
        className="w-6 h-6 flex items-center justify-center shrink-0 text-slate group-hover:text-fog transition-colors"
        style={{ border: "1px solid var(--color-graphite)" }}
      >
        {agent.icon}
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-platinum leading-tight">
          {agent.label}
        </p>
        <p className="text-[10px] text-slate leading-tight mt-0.5 truncate">
          {agent.description}
        </p>
      </div>

    </div>
  );
}


interface AgentLibraryPanelProps {
  onSelect: (type: string) => void;
}

export function AgentLibraryPanel({ onSelect }: AgentLibraryPanelProps) {
  const [query, setQuery] = useState("");
  const filtered = useFilteredAgents(query);

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 220,
        background: "var(--color-charcoal)",
        borderRight: "1px solid var(--color-graphite)",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3"
        style={{ borderBottom: "1px solid var(--color-graphite)" }}
      >
        <p
          className="text-[10px] font-mono uppercase tracking-widest text-slate mb-3"
          style={{ letterSpacing: "0.12em" }}
        >
          Library
        </p>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-2.5 py-1.5"
          style={{ border: "1px solid var(--color-graphite)", background: "var(--color-onyx)" }}
        >
          <Search className="w-3 h-3 text-iron shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents..."
            className="flex-1 bg-transparent border-none outline-none text-[11px] text-fog placeholder:text-iron"
            id="library-search"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-iron hover:text-slate transition-colors text-[10px] leading-none"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-iron text-center py-8 font-mono">
            No agents found
          </p>
        ) : (
          filtered.map((agent) => (
            <AgentRow
              key={agent.type}
              agent={agent}
              onSelect={onSelect}
              draggable
            />
          ))
        )}
      </div>

      {/* Drag hint footer */}
      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid var(--color-graphite)" }}
      >
        <p className="text-[9px] text-iron font-mono leading-relaxed">
          Drag to canvas or click to add
        </p>
      </div>
    </aside>
  );
}


interface AgentLibraryPopoverProps {
  onSelect: (type: string) => void;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function AgentLibraryPopover({
  onSelect,
  children,
  side = "right",
  align = "center",
}: AgentLibraryPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useFilteredAgents(query);

  const handleSelect = (type: string) => {
    onSelect(type);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={side}
          sideOffset={8}
          align={align}
          className="z-[200]"
          style={{
            width: 220,
            background: "var(--color-charcoal)",
            border: "1px solid var(--color-graphite)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
            outline: "none",
          }}
        >
          {/* Search */}
          <div
            className="px-3 pt-3 pb-2"
            style={{ borderBottom: "1px solid var(--color-graphite)" }}
          >
            <p
              className="text-[9px] font-mono uppercase tracking-widest text-slate mb-2"
              style={{ letterSpacing: "0.12em" }}
            >
              Library
            </p>
            <div
              className="flex items-center gap-2 px-2 py-1.5"
              style={{ border: "1px solid var(--color-graphite)", background: "var(--color-onyx)" }}
            >
              <Search className="w-3 h-3 text-iron shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search agents..."
                className="flex-1 bg-transparent border-none outline-none text-[11px] text-fog placeholder:text-iron"
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p className="text-[11px] text-iron text-center py-6 font-mono">
                No agents found
              </p>
            ) : (
              filtered.map((agent) => (
                <AgentRow
                  key={agent.type}
                  agent={agent}
                  onSelect={handleSelect}
                />
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
