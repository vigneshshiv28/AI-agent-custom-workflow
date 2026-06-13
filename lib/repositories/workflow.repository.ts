import prisma from '../db/prisma';
import { Prisma } from '@/app/generated/prisma/client';
import { ScheduleStatus, ScheduleType } from '@/app/generated/prisma/client';

export interface CreateWorkflowData {
  name: string;
  workflow: Prisma.InputJsonValue;
}

export interface UpdateWorkflowData {
  name?: string;
  workflow?: Prisma.InputJsonValue;
}

export interface CreateWorkflowScheduleData {
  workflowId: string;
  cronExpression?: string;
  type: ScheduleType;
  intervalSeconds?: number;
  intervalConfig?: Prisma.InputJsonValue;
  calendarDate?: Date;
  timezone: string;
  status: ScheduleStatus;
  isScheduled: boolean,
  nextRunAt: Date;
}

export interface UpdateWorkflowScheduleData {
  cronExpression?: string;
  timezone?: string;
  status?: ScheduleStatus;
  nextRunAt?: Date;
  lastRunAt?: Date;
  isScheduled?: boolean;
}

export interface CreateExecutionData {
  workflowId: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  output?: Prisma.InputJsonValue;
}

export interface UpdateExecutionData {
  status?: 'RUNNING' | 'SUCCESS' | 'FAILED';
  endedAt?: Date;
  output?: Prisma.InputJsonValue;
}

async function createWorkflow(userId: string, data: CreateWorkflowData) {
  return await prisma.workflow.create({
    data: {
      name: data.name,
      userId: userId,
      workflow: data.workflow,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

async function findWorkflowById(id: string) {
  return await prisma.workflow.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      Schedules: true,
      Executions: {
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
    },
  });
}

async function findWorkflowsByUserId(userId: string) {
  return await prisma.workflow.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
    include: {
      _count: {
        select: {
          Executions: true,
          Schedules: true,
        },
      },
    },
  });
}



async function findWorkflowByUserIdAndName(userId: string, name: string) {
  return await prisma.workflow.findUnique({
    where: { userId_name: { userId, name } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

async function countUntitledWorkflows(userId: string) {
  return await prisma.workflow.count({
    where: {
      userId,
      name: { startsWith: 'Untitled' },
    },
  });
}

async function updateWorkflow(id: string, data: UpdateWorkflowData) {
  return await prisma.workflow.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.workflow && { workflow: data.workflow }),
    },
  });
}

async function deleteWorkflow(id: string) {
  return await prisma.workflow.delete({
    where: { id },
  });
}

// Schedule Workflow

export async function createWorkflowSchedule(data: CreateWorkflowScheduleData) {
  return await prisma.workflowSchedule.create({
    data: {
      workflowId: data.workflowId,
      timezone: data.timezone,
      status: data.status,
      type: data.type,
      nextRunAt: data.nextRunAt,
      cronExpression: data.cronExpression ?? null,
      intervalSeconds: data.intervalSeconds ?? null,
      intervalConfig: data.intervalConfig ?? Prisma.DbNull,
      isScheduled: data.isScheduled,
      calendarDate: data.calendarDate ?? null,
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function updateWorkflowSchedule(id: string, data: UpdateWorkflowScheduleData) {
  return await prisma.workflowSchedule.update({
    where: { id },
    data: {
      ...(data.cronExpression && { cronExpression: data.cronExpression }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.status && { status: data.status }),
      ...(data.nextRunAt && { nextRunAt: data.nextRunAt }),
      ...(data.lastRunAt && { lastRunAt: data.lastRunAt }),
      ...(data.isScheduled && { isScheduled: data.isScheduled }),
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function deleteWorkflowSchedule(id: string) {
  return await prisma.workflowSchedule.delete({
    where: { id },
  });
}

async function findWorkflowScheduleById(id: string) {
  return await prisma.workflowSchedule.findUnique({
    where: { id },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function findWorkflowSchedulesByWorkflowId(workflowId: string) {
  return await prisma.workflowSchedule.findMany({
    where: { workflowId },
    orderBy: { nextRunAt: 'asc' },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function findWorkflowSchedulesByUserId(userId: string) {
  return await prisma.workflowSchedule.findMany({
    where: {
      workflow: {
        userId: userId,
      },
    },
    orderBy: { nextRunAt: 'asc' },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function createExecution(data: CreateExecutionData) {
  return await prisma.workflowExecution.create({
    data: {
      workflowId: data.workflowId,
      status: data.status,
      output: data.output ?? {},
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
}

async function updateExecution(executionId: string, data: UpdateExecutionData) {
  return await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.endedAt && { endedAt: data.endedAt }),
      ...(data.output && { output: data.output }),
    },
    include: {
      workflow: {
        select: { id: true, name: true },
      },
    },
  });
}

async function findExecutionById(executionId: string) {
  return await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        select: { id: true, name: true },
      },
    },
  });
}

async function deleteExecution(executionId: string) {
  return await prisma.workflowExecution.delete({
    where: { id: executionId },
  });
}

async function deleteOldExecutions(days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return await prisma.workflowExecution.deleteMany({
    where: {
      startedAt: { lt: cutoffDate },
    },
  });
}


async function findExecutionByUserId(userId: string, count: number) {
  return prisma.workflowExecution.findMany({
    where: {
      workflow: {
        userId: userId
      }
    },
    orderBy: {
      startedAt: "desc"
    },
    take: count
  })
}


async function findExecutionByWorkflowId(workflowId: string, count: number) {
  return prisma.workflowExecution.findMany({
    where: {
      workflowId: workflowId
    },
    orderBy: {
      startedAt: "desc"
    },
    take: count
  })
}
async function createStartLog(
  executionId: string,
  nodeId: string,
  nodeType: string,
  input?: Prisma.InputJsonValue
) {
  return prisma.workflowExecutionNodeLog.create({
    data: {
      executionId,
      nodeId,
      nodeType,
      input,
      status: "RUNNING",
    },
  });
}

async function createSuccessLog(
  executionId: string,
  nodeId: string,
  nodeType: string,
  output?: Prisma.InputJsonValue
) {
  return prisma.workflowExecutionNodeLog.create({
    data: {
      executionId,
      nodeId,
      nodeType,
      output,
      status: "SUCCESS",
    },
  });
}

async function createFailureLog(
  executionId: string,
  nodeId: string,
  nodeType: string,
  error: string
) {
  return prisma.workflowExecutionNodeLog.create({
    data: {
      executionId,
      nodeId,
      nodeType,
      output: { error },
      status: "FAILED",
    },
  });
}

async function updateEndTime(logId: string) {
  return prisma.workflowExecutionNodeLog.update({
    where: { id: logId },
    data: { endedAt: new Date() },
  });
}

// Dashboard Data

async function getDashboardWorkflows(userId: string) {
  return await prisma.workflow.findMany({
    where: { userId },
    orderBy: { id: 'desc' },
    include: {
      _count: {
        select: {
          Executions: true,
          Schedules: true,
        },
      },
      Executions: {
        orderBy: { startedAt: 'desc' },
        take: 1
      },
      Schedules: {
        where: { status: "ACTIVE" },
        take: 1
      }
    },
  });
}

async function getDashboardMetrics(userId: string) {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

  const [
    totalWorkflows,
    activeSchedules,
    recentExecutionsCount,
    recentExecutionsSuccess,
    recentExecutionsFailed,
    recentExecutionsFeed
  ] = await Promise.all([
    // Total Workflows for user
    prisma.workflow.count({ where: { userId } }),
    // Active schedules across all user's workflows
    prisma.workflowSchedule.count({ where: { workflow: { userId }, status: 'ACTIVE' } }),
    // Total runs in the last 24 hours
    prisma.workflowExecution.count({ where: { workflow: { userId }, startedAt: { gte: twentyFourHoursAgo } } }),
    // Total successful runs in the last 24 hours
    prisma.workflowExecution.count({ where: { workflow: { userId }, startedAt: { gte: twentyFourHoursAgo }, status: 'SUCCESS' } }),
    // Total failed runs in the last 24 hours
    prisma.workflowExecution.count({ where: { workflow: { userId }, startedAt: { gte: twentyFourHoursAgo }, status: 'FAILED' } }),
    // Feed of the 10 most recent executions
    prisma.workflowExecution.findMany({
      where: { workflow: { userId } },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: { workflow: { select: { id: true, name: true } } }
    })
  ]);

  return {
    totalWorkflows,
    activeSchedules,
    recentExecutionsCount,
    successRate: recentExecutionsCount > 0 ? Math.round((recentExecutionsSuccess / recentExecutionsCount) * 100) : 0,
    failedExecutionsCount: recentExecutionsFailed,
    recentExecutionsFeed
  };
}

export const WorkflowRepository = {
  createWorkflow,
  findWorkflowById,
  findWorkflowsByUserId,
  findWorkflowByUserIdAndName,
  countUntitledWorkflows,
  updateWorkflow,
  deleteWorkflow,
  createWorkflowSchedule,
  updateWorkflowSchedule,
  deleteWorkflowSchedule,
  findWorkflowScheduleById,
  findWorkflowSchedulesByWorkflowId,
  findWorkflowSchedulesByUserId,
  createExecution,
  updateExecution,
  findExecutionById,
  deleteExecution,
  deleteOldExecutions,
  createStartLog,
  createSuccessLog,
  createFailureLog,
  updateEndTime,
  getDashboardMetrics,
  getDashboardWorkflows,
  findExecutionByWorkflowId,
  findExecutionByUserId,
};
