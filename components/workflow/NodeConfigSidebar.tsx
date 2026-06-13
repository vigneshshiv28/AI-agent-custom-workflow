import React from 'react';
import { X, Clock, Calendar, RotateCcw, ChevronUp } from 'lucide-react';
import { Node } from 'reactflow';
import { motion } from 'motion/react';
import { ScheduleConfig } from '@/types/components';

interface NodeConfigSidebarProps {
  node: Node;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
}

export const NodeConfigSidebar: React.FC<NodeConfigSidebarProps> = ({ node, onClose, onUpdate }) => {
  const handleChange = (field: string, value: string) => {
    onUpdate(node.id, { ...node.data, [field]: value });
  };

  const handleScheduleChange = (updates: Partial<ScheduleConfig>) => {
    const currentSchedule = node.data.schedule || { mode: 'INTERVAL', value: 1, unit: 'HOURS' };
    let newSchedule = { ...currentSchedule, ...updates } as ScheduleConfig;
    
    if (updates.mode && updates.mode !== currentSchedule.mode) {
      if (updates.mode === 'INTERVAL') newSchedule = { mode: 'INTERVAL', value: 1, unit: 'HOURS' };
      if (updates.mode === 'CRON') newSchedule = { mode: 'CRON', cronExpression: '* * * * *' };
      if (updates.mode === 'CALENDAR') newSchedule = { mode: 'CALENDAR', dateTime: '' };
    }
    
    onUpdate(node.id, { ...node.data, schedule: newSchedule });
  };

  const schedule = node.data.schedule || { mode: 'INTERVAL', value: 1, unit: 'HOURS' };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-80 bg-card/95 backdrop-blur-xl border-l border-white/10 h-full flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)] absolute right-0 top-0 z-50 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="p-5 border-b border-white/10 flex justify-between items-center relative z-10 bg-black/20">
        <h3 className="font-semibold text-foreground tracking-tight flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Node Configuration
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="space-y-2 group">
          <label className="text-[10px] font-bold text-muted-foreground group-focus-within:text-primary uppercase tracking-wider font-mono-data transition-colors">Node Name</label>
          <input 
            type="text" 
            value={node.data.type === 'Trigger' ? 'Trigger' : (node.data.label || '')} 
            onChange={(e) => handleChange('label', e.target.value)}
            disabled={node.data.type === 'Trigger'}
            className={`w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-white/20 ${node.data.type === 'Trigger' ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20'}`}
          />
        </div>
        {node.data.type === 'Trigger' ? (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono-data">Node Type</label>
            <div className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm text-muted-foreground cursor-not-allowed flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary/50" />
              Trigger
            </div>
          </div>
        ) : (
          <div className="space-y-2 group">
            <label className="text-[10px] font-bold text-muted-foreground group-focus-within:text-primary uppercase tracking-wider font-mono-data transition-colors">Node Type</label>
            <div className="relative">
              <select 
                value={node.data.type || 'Action'} 
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all appearance-none hover:border-white/20"
              >
                <option value="Action">Action</option>
                <option value="Monitor">Monitor</option>
                <option value="Decision">Decision</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronUp className="w-4 h-4 rotate-180" />
              </div>
            </div>
          </div>
        )}

        {node.data.type === 'Trigger' && (
          <div className="pt-4 border-t border-border space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-wider font-mono-data">Trigger Schedule</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleScheduleChange({ mode: 'INTERVAL' })}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
                    schedule.mode === 'INTERVAL' 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Interval</span>
                </button>
                <button
                  onClick={() => handleScheduleChange({ mode: 'CRON' })}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
                    schedule.mode === 'CRON' 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Cron</span>
                </button>
                <button
                  onClick={() => handleScheduleChange({ mode: 'CALENDAR' })}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-md border transition-colors ${
                    schedule.mode === 'CALENDAR' 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-[9px] uppercase font-bold tracking-wider">Calendar</span>
                </button>
              </div>
            </div>

            {schedule.mode === 'INTERVAL' && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono-data">Every</label>
                    <input 
                      type="number" 
                      min="1"
                      value={schedule.value || 1}
                      onChange={(e) => handleScheduleChange({ value: parseInt(e.target.value) || 1 })}
                      className="w-full bg-background border border-border rounded-none p-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono-data">Unit</label>
                    <select 
                      value={schedule.unit || 'HOURS'}
                      onChange={(e) => handleScheduleChange({ unit: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-none p-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors appearance-none"
                    >
                      <option value="MINUTES">Minutes</option>
                      <option value="HOURS">Hours</option>
                      <option value="DAYS">Days</option>
                      <option value="WEEKS">Weeks</option>
                      <option value="MONTHS">Months</option>
                    </select>
                  </div>
                </div>
                {(schedule.unit === 'DAYS' || schedule.unit === 'WEEKS' || schedule.unit === 'MONTHS') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono-data">At Time (Optional)</label>
                    <input 
                      type="time" 
                      value={schedule.time || ''}
                      onChange={(e) => handleScheduleChange({ time: e.target.value })}
                      className="w-full bg-background border border-border rounded-none p-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            )}

            {schedule.mode === 'CRON' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono-data">Cron Expression</label>
                <input 
                  type="text" 
                  value={schedule.cronExpression || ''}
                  onChange={(e) => handleScheduleChange({ cronExpression: e.target.value })}
                  placeholder="* * * * *"
                  className="w-full bg-background border border-border rounded-none p-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors font-mono-data"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Format: min hour day month day-of-week</p>
              </div>
            )}

            {schedule.mode === 'CALENDAR' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono-data">Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={schedule.dateTime || ''}
                  onChange={(e) => handleScheduleChange({ dateTime: e.target.value })}
                  className="w-full bg-background border border-border rounded-none p-2.5 text-sm text-foreground focus:border-primary outline-none transition-colors"
                />
              </div>
            )}
          </div>
        )}

        {node.data.type !== 'Trigger' && (
          <div className="space-y-2 group">
            <label className="text-[10px] font-bold text-muted-foreground group-focus-within:text-primary uppercase tracking-wider font-mono-data transition-colors">Description</label>
            <textarea 
              value={node.data.description || ''} 
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all min-h-[120px] resize-none hover:border-white/20"
              placeholder="What does this node do?"
            />
          </div>
        )}
        <div className="space-y-2 group">
          <label className="text-[10px] font-bold text-muted-foreground group-focus-within:text-primary uppercase tracking-wider font-mono-data transition-colors">Endpoint URL</label>
          <input 
            type="text" 
            value={node.data.endpoint || ''} 
            onChange={(e) => handleChange('endpoint', e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all hover:border-white/20"
            placeholder="https://api.example.com/v1"
          />
        </div>
      </div>
    </motion.div>
  );
};
