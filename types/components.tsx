import React from 'react';

export enum WorkflowStatus {
  Active = 'Active',
  Paused = 'Paused',
  Error = 'Error',
}

export interface WorkflowApp {
  name: string;
  icon: string; // URL or icon name
}

export interface CronScheduleConfig {
  mode: 'CRON';
  cronExpression: string;
}

export interface IntervalScheduleConfig {
  mode: 'INTERVAL';
  unit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
  value: number;
  time?: string;
}

export interface CalendarScheduleConfig {
  mode: 'CALENDAR';
  dateTime: string;
}

export type ScheduleConfig = CronScheduleConfig | IntervalScheduleConfig | CalendarScheduleConfig;

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  apps: WorkflowApp[];
  status: WorkflowStatus;
  lastRun: string;
  successRate: number;
  schedule?: ScheduleConfig;
}

export interface Metric {
  label: string;
  value: string;
  trend?: string; 
  status?: 'neutral' | 'positive' | 'negative' | 'warning';
  icon: React.ReactNode;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  apps: WorkflowApp[];
}