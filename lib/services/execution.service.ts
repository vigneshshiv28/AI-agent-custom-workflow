import { WorkflowRepository, CreateExecutionData, UpdateExecutionData } from '../repositories';
import { WorkflowStatus } from '@/app/generated/prisma/client';

export interface CreateWorkflowExecutionData {
  workflowId: string;
  status?: WorkflowStatus;
  output?: any;
}

export interface UpdateWorkflowExecutionData {
  status?: WorkflowStatus;
  endedAt?: Date;
  output?: any;
}

async function createWorkflowExecution(data: CreateWorkflowExecutionData) {
  const workflow = await WorkflowRepository.findWorkflowById(data.workflowId);

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  const executionData: CreateExecutionData = {
    workflowId: data.workflowId,
    status: data.status || 'RUNNING',
    output: data.output || {},
  };

  return await WorkflowRepository.createExecution(executionData);
}

async function updateWorkflowExecution(executionId: string, data: UpdateWorkflowExecutionData) {
  const existingExecution = await WorkflowRepository.findExecutionById(executionId);

  if (!existingExecution) {
    throw new Error('Execution not found');
  }

  const updateData: UpdateExecutionData = {
    ...(data.status && { status: data.status }),
    ...(data.endedAt && { endedAt: data.endedAt }),
    ...(data.output && { output: data.output }),
  };

  return await WorkflowRepository.updateExecution(executionId, updateData);
}

async function deleteWorkflowExecution(executionId: string) {
  const existingExecution = await WorkflowRepository.findExecutionById(executionId);

  if (!existingExecution) {
    throw new Error('Execution not found');
  }

  return await WorkflowRepository.deleteExecution(executionId);
}

async function getWorkflowExecutionById(executionId: string) {
  const execution = await WorkflowRepository.findExecutionById(executionId);

  if (!execution) {
    throw new Error('Execution not found');
  }

  return execution;
}

export const ExecutionService = {
  createWorkflowExecution,
  updateWorkflowExecution,
  deleteWorkflowExecution,
  getWorkflowExecutionById,
};
