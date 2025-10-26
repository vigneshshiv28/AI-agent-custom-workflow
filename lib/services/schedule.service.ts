import { WorkflowRepository, CreateWorkflowScheduleData, UpdateWorkflowScheduleData } from '../repositories';
import { ScheduleStatus, ScheduleType } from '@/app/generated/prisma/client';
import { SchedulerClient, registerScheduleJobSchema } from '../client';
import parser from 'cron-parser';
import { DateTime } from 'luxon';

interface CreateWorkflowSchedule {
  workflowId: string;
  timezone: string;
  status: ScheduleStatus;
  type: CronScheduleConfig | IntervalScheduleConfig | CalendarScheduleConfig;
}

interface UpdateWorkflowSchedule{
  timezone?: string; 
  isSchedule?: boolean;
  type?: CronScheduleConfig | IntervalScheduleConfig | CalendarScheduleConfig;
}

interface CronScheduleConfig {
  mode: 'CRON';
  cronExpression: string;
}

interface IntervalScheduleConfig {
  mode: 'INTERVAL';
  unit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
  value: number;
  time?: string;
}

interface CalendarScheduleConfig {
  mode: 'CALENDAR';
  dateTime: Date;
}

async function createWorkflowSchedule(schedule: CreateWorkflowSchedule) {
  const workflow = await WorkflowRepository.findWorkflowById(schedule.workflowId);

  if (!workflow) {
    throw new Error('Workflow does not exist');
  }

  const nextRunAt = calculateNextRunTime(schedule.type, schedule.timezone);

  let scheduleData: CreateWorkflowScheduleData = {
    type: 'CRON' as ScheduleType,
    workflowId: schedule.workflowId,
    timezone: schedule.timezone,
    status: schedule.status,
    isScheduled: false,
    nextRunAt,
  };

  switch (schedule.type.mode) {
    case 'CRON':
      scheduleData.type = 'CRON' as ScheduleType;
      scheduleData.cronExpression = schedule.type.cronExpression;
      break;

    case 'INTERVAL':
      scheduleData.type = 'INTERVAL' as ScheduleType;
      scheduleData.intervalSeconds = convertIntervalToSeconds(
        schedule.type.unit,
        schedule.type.value
      );

      if (schedule.type.time) {
        scheduleData.cronExpression = convertIntervalToCron(schedule.type);
      }
      break;

    case 'CALENDAR':
      scheduleData.type = 'CALENDAR' as ScheduleType;
      scheduleData.calendarDate = schedule.type.dateTime;

      break;
  }

  const newSchedule = await WorkflowRepository.createWorkflowSchedule(scheduleData);

  return newSchedule;
}

async function registerScheduleJob(job: registerScheduleJobSchema) {
  try {
    const response = await SchedulerClient.registerScheduleJob(job);

    return {
      success: true,
      message: 'Schedule job registered successfully',
      data: response,
    };
  } catch (error: any) {
    console.error('Service error registering schedule job:', error);

    return {
      success: false,
      message: error.message || 'Failed to register schedule job',
    };
  }
}

async function getWorkflowSchedulesByUserId(userId: string) {
  const schedules = await WorkflowRepository.findWorkflowSchedulesByUserId(userId);
  return schedules;
}

async function getWorkflowScheduleById(id: string) {
  const schedule = await WorkflowRepository.findWorkflowScheduleById(id);
  return schedule;
}

async function deleteWorkflowSchedule(id: string) {
  const schedule = await WorkflowRepository.deleteWorkflowSchedule(id);
  return schedule;
}

async function updateWorkflowScheduleById(
  scheduleId: string,
  schedule: UpdateWorkflowSchedule
) {
  const existingSchedule = await WorkflowRepository.findWorkflowScheduleById(scheduleId);

  if (!existingSchedule) {
    throw new Error("Schedule does not exist");
  }

  const updateData: UpdateWorkflowScheduleData = {};


  if (schedule.timezone) {
    updateData.timezone = schedule.timezone;
  }


  if (typeof schedule.isSchedule === "boolean") {
    updateData.isScheduled = schedule.isSchedule;
  }


  if (schedule.type) {
    switch (schedule.type.mode) {
      case "CRON":
        updateData.cronExpression = schedule.type.cronExpression;
        break;

      case "INTERVAL":
        updateData.cronExpression = convertIntervalToCron(schedule.type);
        break;

      case "CALENDAR":
        updateData.nextRunAt = schedule.type.dateTime;
        break;
    }
  }

 
  const updated = await WorkflowRepository.updateWorkflowSchedule(scheduleId, updateData);
  return updated;
}


function calculateNextRunTime(
  config: CronScheduleConfig | IntervalScheduleConfig | CalendarScheduleConfig,
  timezone: string
): Date {
  const now = DateTime.now().setZone(timezone);

  switch (config.mode) {
    case 'CRON': {
      const interval = parser.parse(config.cronExpression, { tz: timezone });
      return interval.next().toDate();
    }
    case 'INTERVAL': {
      if (config.time) {
        const [hours, minutes] = config.time.split(':').map(Number);
        let nextRun = now.set({ hour: hours, minute: minutes, second: 0 });

        if (nextRun <= now) {
          nextRun = addInterval(nextRun, config.unit, config.value);
        }
        return nextRun.toJSDate();
      }

      return addInterval(now, config.unit, config.value).toJSDate();
    }
    case 'CALENDAR': {
      return config.dateTime;
    }
  }
}

function addInterval(
  dateTime: DateTime,
  unit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS',
  value: number
): DateTime {
  switch (unit) {
    case 'MINUTES':
      return dateTime.plus({ minutes: value });
    case 'HOURS':
      return dateTime.plus({ hours: value });
    case 'DAYS':
      return dateTime.plus({ days: value });
    case 'WEEKS':
      return dateTime.plus({ weeks: value });
    case 'MONTHS':
      return dateTime.plus({ months: value });
  }
}

function convertIntervalToSeconds(
  unit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS',
  value: number
): number {
  const secondsMap = {
    MINUTES: 60,
    HOURS: 3600,
    DAYS: 86400,
    WEEKS: 604800,
    MONTHS: 2592000,
  };
  return secondsMap[unit] * value;
}

function convertIntervalToCron(config: IntervalScheduleConfig): string {
  if (!config.time) return '';

  const [hours, minutes] = config.time.split(':').map(Number);

  switch (config.unit) {
    case 'DAYS':
      return `${minutes} ${hours} */${config.value} * *`;
    case 'WEEKS':
      return `${minutes} ${hours} * * 0`;
    case 'MONTHS':
      return `${minutes} ${hours} 1 */${config.value} *`;
    default:
      return '';
  }
}

export const ScheduleService = {
  createWorkflowSchedule,
  registerScheduleJob,
  updateWorkflowScheduleById,
  getWorkflowSchedulesByUserId,
  getWorkflowScheduleById,
  deleteWorkflowSchedule,
};
