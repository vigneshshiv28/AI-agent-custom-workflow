import React from 'react';
import { 
  Home, 
  LayoutGrid, 
  FileText, 
  Activity, 
  Settings, 
  Shield, 
  Terminal,
  Cpu
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 group relative ${
      active 
        ? 'text-primary bg-primary/5' 
        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    }`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
    <div className={`transition-colors ${active ? 'text-primary' : 'group-hover:text-primary'}`}>
      {icon}
    </div>
    <span className="text-xs font-mono-data uppercase tracking-widest font-medium">
      {label}
    </span>
  </button>
);

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col sticky top-20 h-[calc(100vh-5rem)] z-20">
      <div className="flex-1 py-6">
        <div className="px-4 mb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 font-mono-data">
            Main Menu
          </div>
        </div>
        <nav className="space-y-1">
          <SidebarItem icon={<Home size={18} />} label="Dashboard" active />
          <SidebarItem icon={<LayoutGrid size={18} />} label="Workflows" />
          <SidebarItem icon={<FileText size={18} />} label="Templates" />
          <SidebarItem icon={<Activity size={18} />} label="Metrics" />
        </nav>

        <div className="px-4 mt-10 mb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 font-mono-data">
            System
          </div>
        </div>
        <nav className="space-y-1">
          <SidebarItem icon={<Terminal size={18} />} label="Logs" />
          <SidebarItem icon={<Shield size={18} />} label="Security" />
          <SidebarItem icon={<Settings size={18} />} label="Settings" />
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-6 border-t border-border bg-black/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 border border-primary/20">
            <Cpu size={16} className="text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-foreground font-mono-data uppercase">Node-01</div>
            <div className="text-[9px] text-primary font-mono-data uppercase tracking-tighter">Operational</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-mono-data uppercase text-muted-foreground">
            <span>CPU Load</span>
            <span className="text-foreground">12%</span>
          </div>
          <div className="h-1 bg-white/5 overflow-hidden">
            <div className="h-full bg-primary w-[12%]" />
          </div>
          
          <div className="flex justify-between text-[9px] font-mono-data uppercase text-muted-foreground mt-2">
            <span>Memory</span>
            <span className="text-foreground">2.4GB</span>
          </div>
          <div className="h-1 bg-white/5 overflow-hidden">
            <div className="h-full bg-primary w-[45%]" />
          </div>
        </div>
      </div>
    </aside>
  );
};