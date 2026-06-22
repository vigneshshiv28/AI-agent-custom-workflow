"use client"
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarItemProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-6 py-2.5 transition-all duration-150 ease-ui-out active:scale-[0.97] cursor-pointer relative text-left ${
      active 
        ? 'bg-[#161618] text-[#FAFAFA]' 
        : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#161618]'
    }`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F49ACB]" />}
    <span className="text-[13px] font-mono tracking-tight uppercase">
      {label}
    </span>
  </button>
);

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-[220px] bg-[#111113] border-r border-[#26262B] flex flex-col h-full z-20">
      <div className="flex-1 py-6">
        <nav className="space-y-0.5">
          <SidebarItem 
            label="Workflows" 
            active={pathname === '/dashboard'} 
            onClick={() => router.push('/dashboard')} 
          />
          <SidebarItem 
            label="Executions" 
            active={pathname === '/dashboard/executions'}
          />
          <SidebarItem 
            label="Templates" 
            active={pathname === '/dashboard/templates'}
          />
          <SidebarItem 
            label="Connections" 
            active={pathname === '/dashboard/connections'}
            onClick={() => router.push('/dashboard/connections')}
          />
          <SidebarItem 
            label="Settings" 
            active={pathname === '/dashboard/settings'}
          />
        </nav>
      </div>
    </aside>
  );
};