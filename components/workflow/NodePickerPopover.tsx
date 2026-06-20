"use client"
import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { Plus, Search, Zap, Activity, GitBranch } from 'lucide-react';

interface NodePickerPopoverProps {
  onSelect: (type: string) => void;
  children?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export function NodePickerPopover({ onSelect, children, side = 'right', align = 'center' }: NodePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSelect = (type: string) => {
    onSelect(type);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {children || (
          <button className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-primary text-primary-foreground border-2 border-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-40 hover:scale-110 shadow-lg cursor-pointer hover:bg-white hover:text-black">
            <Plus className="w-3 h-3" />
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          side={side} 
          sideOffset={10} 
          align={align}
          className="z-[100] w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden font-sans animate-popover-in"
          style={{ transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
        >
          <Command 
            className="w-full bg-transparent p-2"
            shouldFilter={true}
          >
            <div className="flex items-center border-b border-border px-3 pb-2 mb-2">
              <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <Command.Input 
                autoFocus
                placeholder="Search steps..." 
                value={search}
                onValueChange={setSearch}
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground h-8"
              />
            </div>
            <Command.List className="max-h-60 overflow-y-auto w-full select-none">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
              <Command.Group heading="Actions" className="px-1 text-xs font-semibold text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:mb-1">
                <Command.Item 
                  value="action"
                  onSelect={() => handleSelect('Action')}
                  className="flex flex-col px-2 py-2 text-sm text-foreground rounded-md cursor-pointer data-[selected=true]:bg-secondary/50 transition-all duration-150 ease-ui-out active:scale-[0.97]"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-medium">Action</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 ml-6">Perform an action in a connected app</span>
                </Command.Item>
                <Command.Item 
                  value="monitor"
                  onSelect={() => handleSelect('Monitor')}
                  className="flex flex-col px-2 py-2 text-sm text-foreground rounded-md cursor-pointer data-[selected=true]:bg-secondary/50 transition-all duration-150 ease-ui-out active:scale-[0.97] mt-1"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-medium">Monitor</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 ml-6">Monitor an endpoint or service</span>
                </Command.Item>
              </Command.Group>
              <Command.Group heading="Logic" className="px-1 text-xs font-semibold text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:mb-1 mt-2">
                <Command.Item 
                  value="decision"
                  onSelect={() => handleSelect('Decision')}
                  className="flex flex-col px-2 py-2 text-sm text-foreground rounded-md cursor-pointer data-[selected=true]:bg-secondary/50 transition-all duration-150 ease-ui-out active:scale-[0.97]"
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-primary" />
                    <span className="font-medium">Decision</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 ml-6">Branch based on conditions</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
