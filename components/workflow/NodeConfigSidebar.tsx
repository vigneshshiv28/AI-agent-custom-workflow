import React, { useState } from 'react';
import { X, Clock, Calendar, RotateCcw, ChevronDown, CalendarDays } from 'lucide-react';
import { Node } from 'reactflow';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ScheduleConfig } from '@/types/components';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface NodeConfigSidebarProps {
  node: Node;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onDelete?: (id: string) => void;
}

export const NodeConfigSidebar: React.FC<NodeConfigSidebarProps> = ({ node, onClose, onUpdate, onDelete }) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

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

  // Parse stored dateTime (ISO or datetime-local format) into a Date object
  const selectedDate: Date | undefined = (() => {
    if (schedule.mode !== 'CALENDAR' || !schedule.dateTime) return undefined;
    const d = new Date(schedule.dateTime);
    return isNaN(d.getTime()) ? undefined : d;
  })();

  // Extract time part from stored dateTime
  const selectedTime: string = (() => {
    if (!schedule.dateTime) return '00:00';
    const d = new Date(schedule.dateTime);
    if (isNaN(d.getTime())) return '00:00';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  })();

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const [h, m] = selectedTime.split(':').map(Number);
    date.setHours(h || 0, m || 0, 0, 0);
    handleScheduleChange({ dateTime: date.toISOString() });
    setCalendarOpen(false);
  };

  const handleTimeChange = (timeStr: string) => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    const [h, m] = timeStr.split(':').map(Number);
    base.setHours(h || 0, m || 0, 0, 0);
    handleScheduleChange({ dateTime: base.toISOString() });
  };

  const inputClass = `
    w-full bg-[#09090B] border border-[#26262B]
    px-3 py-2 text-[13px] text-[#FAFAFA]
    focus:border-[#F49ACB] outline-none
    placeholder:text-[#3F3F46]
    transition-colors duration-150
  `.replace(/\s+/g, ' ').trim();

  const labelClass = "text-[10px] uppercase tracking-widest text-[#52525B] font-mono block mb-1.5";

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-[360px] bg-[#111113] border-l border-[#26262B] h-full flex flex-col absolute right-0 top-0 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-[#26262B] flex-shrink-0">
        <span className="text-[13px] font-medium text-[#FAFAFA] tracking-tight">Configure Node</span>
        <div className="flex items-center gap-2">
          {node.data.type !== 'Trigger' && onDelete && (
            <button
              onClick={() => onDelete(node.id)}
              className="text-[11px] font-medium text-red-400 hover:text-red-300 transition-all duration-150 ease-ui-out active:scale-[0.97] cursor-pointer px-2 py-1 bg-red-400/10 hover:bg-red-400/20 rounded"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[#52525B] hover:text-[#A1A1AA] transition-all duration-150 ease-ui-out active:scale-[0.97] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Node Name */}
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={node.data.type === 'Trigger' ? 'Trigger' : (node.data.label || '')}
            onChange={(e) => handleChange('label', e.target.value)}
            disabled={node.data.type === 'Trigger'}
            className={`${inputClass} ${node.data.type === 'Trigger' ? 'opacity-40 cursor-not-allowed' : ''}`}
            placeholder="Node name"
          />
        </div>

        {/* Node Type */}
        {node.data.type === 'Trigger' ? (
          <div>
            <label className={labelClass}>Type</label>
            <div className="px-3 py-2 bg-[#09090B] border border-[#26262B] text-[13px] text-[#3F3F46]">
              Trigger
            </div>
          </div>
        ) : (
          <div>
            <label className={labelClass}>Type</label>
            <div className="relative">
              <select
                value={node.data.type || 'Action'}
                onChange={(e) => handleChange('type', e.target.value)}
                className={`${inputClass} appearance-none pr-8 cursor-pointer`}
              >
                <option value="Action">Action</option>
                <option value="Monitor">Monitor</option>
                <option value="Decision">Decision</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525B] pointer-events-none" />
            </div>
          </div>
        )}

        {/* Trigger Schedule */}
        {node.data.type === 'Trigger' && (
          <div className="pt-4 border-t border-[#26262B] space-y-4">
            <div>
              <label className={labelClass}>Schedule</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'None', icon: null, action: () => onUpdate(node.id, { ...node.data, schedule: undefined }), active: !node.data.schedule },
                  { label: 'Interval', icon: <RotateCcw className="w-3.5 h-3.5" />, action: () => handleScheduleChange({ mode: 'INTERVAL' }), active: schedule.mode === 'INTERVAL' && node.data.schedule },
                  { label: 'Cron', icon: <Clock className="w-3.5 h-3.5" />, action: () => handleScheduleChange({ mode: 'CRON' }), active: schedule.mode === 'CRON' && node.data.schedule },
                  { label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5" />, action: () => handleScheduleChange({ mode: 'CALENDAR' }), active: schedule.mode === 'CALENDAR' && node.data.schedule },
                ].map(({ label, icon, action, active }) => (
                  <button
                    key={label}
                    onClick={action}
                    className={`flex items-center gap-2 px-3 py-2 border text-[11px] font-mono tracking-wider transition-all duration-150 ease-ui-out active:scale-[0.97] cursor-pointer ${active
                      ? 'border-[#F49ACB] text-[#F49ACB] bg-[#F49ACB]/5'
                      : 'border-[#26262B] text-[#52525B] hover:border-[#3F3F46] hover:text-[#A1A1AA]'
                      }`}
                  >
                    {icon}
                    {label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {schedule.mode === 'INTERVAL' && node.data.schedule && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Every</label>
                  <input
                    type="number"
                    min="1"
                    value={schedule.value || 1}
                    onChange={(e) => handleScheduleChange({ value: parseInt(e.target.value) || 1 })}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Unit</label>
                  <div className="relative">
                    <select
                      value={schedule.unit || 'HOURS'}
                      onChange={(e) => handleScheduleChange({ unit: e.target.value as any })}
                      className={`${inputClass} appearance-none pr-7 cursor-pointer`}
                    >
                      <option value="MINUTES">Minutes</option>
                      <option value="HOURS">Hours</option>
                      <option value="DAYS">Days</option>
                      <option value="WEEKS">Weeks</option>
                      <option value="MONTHS">Months</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#52525B] pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {(schedule.unit === 'DAYS' || schedule.unit === 'WEEKS' || schedule.unit === 'MONTHS') && schedule.mode === 'INTERVAL' && node.data.schedule && (
              <div>
                <label className={labelClass}>At time (optional)</label>
                <input
                  type="time"
                  value={schedule.time || ''}
                  onChange={(e) => handleScheduleChange({ time: e.target.value })}
                  className={`${inputClass} appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none`}
                />
              </div>
            )}

            {schedule.mode === 'CRON' && node.data.schedule && (
              <div>
                <label className={labelClass}>Cron expression</label>
                <input
                  type="text"
                  value={schedule.cronExpression || ''}
                  onChange={(e) => handleScheduleChange({ cronExpression: e.target.value })}
                  placeholder="* * * * *"
                  className={`${inputClass} font-mono`}
                />
                <p className="text-[10px] text-[#3F3F46] mt-1.5 font-mono">min hour day month weekday</p>
              </div>
            )}

            {/* Calendar date picker */}
            {schedule.mode === 'CALENDAR' && node.data.schedule && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Date</label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className={`${inputClass} w-full flex items-center justify-between cursor-pointer transition-all duration-150 ease-ui-out active:scale-[0.99]`}
                      >
                        <span className={selectedDate ? 'text-[#FAFAFA]' : 'text-[#3F3F46]'}>
                          {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                        </span>
                        <CalendarDays className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 border-[#26262B] bg-[#111113] shadow-xl"
                      align="start"
                      side="bottom"
                      style={{ zIndex: 9999 }}
                    >
                      <CalendarPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}

                        className="text-[#FAFAFA] [&_.rdp-day_selected]:bg-[#F49ACB] [&_.rdp-day_selected]:text-black [&_.rdp-day:hover:not(.rdp-day_selected)]:bg-[#26262B] [&_.rdp-nav_button]:text-[#A1A1AA] [&_.rdp-nav_button:hover]:bg-[#26262B]"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className={labelClass}>Time</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className={`${inputClass} appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none`}
                  />
                </div>

                {selectedDate && (
                  <div className="px-3 py-2 bg-[#F49ACB]/5 border border-[#F49ACB]/20 text-[11px] text-[#F49ACB] font-mono">
                    {format(selectedDate, 'EEE, MMM d yyyy')} at {selectedTime}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {node.data.type !== 'Trigger' && (
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={node.data.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`${inputClass} min-h-[90px] resize-none`}
              placeholder="What does this node do?"
            />
          </div>
        )}

        {/* Prompt */}
        {node.data.type !== 'Trigger' && (
          <div>
            <label className={labelClass}>Prompt</label>
            <textarea
              value={node.data.Prompt || ''}
              onChange={(e) => handleChange('Prompt', e.target.value)}
              className={`${inputClass} min-h-[120px] resize-none`}
              placeholder="Enter the instruction for this step..."
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
