import prisma from '@/lib/db/prisma';
import { Prisma, IntegrationStatus } from '@/app/generated/prisma/client';

export interface CreateIntegrationData {
  userId: string;
  provider: string;
  credentials: Prisma.InputJsonObject;
}

export interface UpdateIntegrationData {
  credentials: Prisma.InputJsonObject;
  status?: IntegrationStatus;
}

async function findIntegrationsByUserId(userId: string) {
  return prisma.integration.findMany({
    where: { userId },
  });
}

async function findIntegrationByUserIdAndProvider(userId: string, provider: string) {
  return prisma.integration.findFirst({
    where: { userId, provider },
  });
}

async function createIntegration(data: CreateIntegrationData) {
  return prisma.integration.create({
    data: {
      userId: data.userId,
      provider: data.provider,
      credentials: data.credentials,
      status: IntegrationStatus.CONNECTED,
    },
  });
}

async function updateIntegration(id: string, data: UpdateIntegrationData) {
  return prisma.integration.update({
    where: { id },
    data: {
      credentials: data.credentials,
      ...(data.status && { status: data.status }),
      updatedAt: new Date(),
    },
  });
}

async function deleteIntegration(id: string) {
  return prisma.integration.delete({
    where: { id },
  });
}

export const IntegrationRepository = {
  findIntegrationsByUserId,
  findIntegrationByUserIdAndProvider,
  createIntegration,
  updateIntegration,
  deleteIntegration,
};
