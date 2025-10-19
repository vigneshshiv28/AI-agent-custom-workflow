import prisma from "../db/prisma";
import { Prisma } from "@/app/generated/prisma/client";


interface CreateWorkflowData{
    userId: string,
    name: string,
    workflow: Prisma.InputJsonValue
}

interface UpdateWorkflowData{
    name?: string,
    workflow?: Prisma.InputJsonValue
}

export async function createWorkflow(data:CreateWorkflowData){
    return await prisma.workflow.create({
        data:{
            name: data.name,
            userId: data.userId,
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

export async function findWorkflowById(id: string) {
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

export async function findWorkflowsByUserId(userId: string) {
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

export async function updateWorkflow(id: string, data: UpdateWorkflowData){
  return await prisma.workflow.update({
    where:{id},
    data: {
        ...(data.name && { name: data.name }),
        ...(data.workflow && { workflow: data.workflow }),
    }
  })
}

export async function deleteWorkflow(id: string) {
  return await prisma.workflow.delete({
    where: { id },
  });
}