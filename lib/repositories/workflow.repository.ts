import prisma from "../db/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { ScheduleStatus,ScheduleType } from "@/app/generated/prisma/client";


export interface CreateWorkflowData{
    name: string,
    workflow: Prisma.InputJsonValue
}

export interface UpdateWorkflowData{
    name?: string,  
    workflow?: Prisma.InputJsonValue
}

export interface CreateWorkflowScheduleData{
    workflowId: string,
    cronExpression?: string,
    type: ScheduleType,
    intervalSeconds?: number,
    intervalConfig?: Prisma.InputJsonValue,
    calendarDate?: Date,
    timezone: string,
    status: ScheduleStatus, 
    nextRunAt: Date
}

export interface UpdateWorkflowScheduleData{
    cronExpression?: string,
    timezone?: string,
    status?: ScheduleStatus, 
    nextRunAt?: Date
    lastRunAt?: Date
}

export interface CreateExecutionData {
  workflowId: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  output?: Prisma.InputJsonValue;
}

export interface UpdateExecutionData {
  status?: "RUNNING" | "SUCCESS" | "FAILED";
  endedAt?: Date;
  output?: Prisma.InputJsonValue;
}

async function createWorkflow(userId: string, data:CreateWorkflowData){
    return await prisma.workflow.create({
        data:{
            name: data.name,
            userId: userId,
            workflow: data.workflow
        },
        include:{
            user:{
                select:{
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    })
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
        orderBy: { startedAt: "desc" },
        take: 10,
      },
    },
  });
}

async function findWorkflowsByUserId(userId: string) {
  return await prisma.workflow.findMany({
    where: { userId },
    orderBy: { id: "desc" },
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

async function findWorkflowByUserIdAndName(userId: string, name: string){
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

async function updateWorkflow(id: string, data: UpdateWorkflowData){
  return await prisma.workflow.update({
    where:{id},
    data: {
        ...(data.name && { name: data.name }),
        ...(data.workflow && { workflow: data.workflow }),
    }
  })
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

async function updateWorkflowSchedule(id: string, data: UpdateWorkflowScheduleData){
  return await prisma.workflowSchedule.update({
    where:{id},
    data:{
      ...(data.cronExpression && { cronExpression: data.cronExpression }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.status && { status: data.status }),
      ...(data.nextRunAt && { nextRunAt: data.nextRunAt }),
      ...(data.lastRunAt && { lastRunAt: data.lastRunAt })
    },
    include:{
      workflow:{
        select:{
          id: true,
          name: true,
        }
      }
    }
  })
}

async function deleteWorkflowSchedule(id: string) {
  return await prisma.workflowSchedule.delete({
    where:{id}
  })
}

async function findWorkflowScheduleById(id: string) {
  return await prisma.workflowSchedule.findUnique({
    where:{id},
    include:{
      workflow:{
        select:{
          id: true,
          name: true,
        }
      }
    }
  })
} 

async function findWorkflowSchedulesByWorkflowId(workflowId: string) {
  return await prisma.workflowSchedule.findMany({
    where:{workflowId},
    orderBy:{nextRunAt: "asc"},
    include:{
      workflow:{
        select:{
          id: true,
          name: true,
        }
      }
    }
  })
}

async function findWorkflowSchedulesByUserId(userId: string) {
  return await prisma.workflowSchedule.findMany({
    where: {
      workflow: {  
        userId: userId,
      },
    },
    orderBy: { nextRunAt: "asc" },
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

async function deleteOldExecutions(days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return await prisma.workflowExecution.deleteMany({
    where: {
      startedAt: { lt: cutoffDate },
    },
  });
}


export const WorkflowRepository = {
  createWorkflow,
  findWorkflowById,
  findWorkflowsByUserId,
  findWorkflowByUserIdAndName,
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
  deleteOldExecutions
}