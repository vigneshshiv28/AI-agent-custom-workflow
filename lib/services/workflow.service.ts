import {
  WorkflowRepository,
  UserRepository,
  UpdateWorkflowData,
} from '../repositories';
import { workflowSchema } from '@/shared/schema/workflow';
import { WorkflowResponse, WorkflowListResponse } from '@/shared/contracts/workflow.contract';

function mapToWorkflowResponse(dbWorkflow: any): WorkflowResponse {
  return {
    ...dbWorkflow,
    workflow: workflowSchema.parse(dbWorkflow.workflow),
  };
}

function mapToWorkflowListResponse(dbWorkflow: any): WorkflowListResponse {
  return {
    ...dbWorkflow,
    workflow: workflowSchema.parse(dbWorkflow.workflow),
  } as WorkflowListResponse;
}

async function createWorkflow(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Auto-generate Untitled N name
  const untitledCount = await WorkflowRepository.countUntitledWorkflows(userId);
  let name = `Untitled ${untitledCount + 1}`;

  // Handle collision (e.g. if Untitled 1 was deleted and recreated)
  let collision = await WorkflowRepository.findWorkflowByUserIdAndName(userId, name);
  while (collision) {
    const count = parseInt(name.replace('Untitled ', ''), 10);
    name = `Untitled ${count + 1}`;
    collision = await WorkflowRepository.findWorkflowByUserIdAndName(userId, name);
  }

  const newWorkflow = await WorkflowRepository.createWorkflow(userId, {
    name,
    workflow: { graph: { nodes: [], edges: [] } },
  });

  return mapToWorkflowResponse(newWorkflow);
}

export async function getWorkflowById(workflowId: string, userId: string): Promise<WorkflowResponse> {
  const workflow = await WorkflowRepository.findWorkflowById(workflowId);

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  if (workflow.userId !== userId) {
    throw new Error('Workflow not found');
  }

  return mapToWorkflowResponse(workflow);
}

async function getWorkflowsByUserId(userId: string): Promise<WorkflowListResponse[]> {
  const user = await UserRepository.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const workflows = await WorkflowRepository.findWorkflowsByUserId(userId);

  return workflows.map(mapToWorkflowListResponse);
}

async function updateWorkflow(userId: string, id: string, workflow: UpdateWorkflowData): Promise<WorkflowResponse> {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const existingWorkflow = await WorkflowRepository.findWorkflowById(id);

  if (!existingWorkflow || userId !== existingWorkflow.userId) {
    throw new Error('Workflow does not exist');
  }

  const updatedWorkflow = await WorkflowRepository.updateWorkflow(id, workflow);

  return mapToWorkflowResponse(updatedWorkflow);
}

async function deleteWorkflow(userId: string, id: string): Promise<void> {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const existingWorkflow = await WorkflowRepository.findWorkflowById(id);

  if (!existingWorkflow || userId !== existingWorkflow.userId) {
    throw new Error('Workflow does not exist');
  }

  await WorkflowRepository.deleteWorkflow(id);
}

async function getDashboardWorkflows(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  const workflows = await WorkflowRepository.getDashboardWorkflows(userId);
  return workflows.map(mapToWorkflowListResponse);
}

async function getDashboardMetrics(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return await WorkflowRepository.getDashboardMetrics(userId);
}

export const WorkflowService = {
  createWorkflow,
  getWorkflowById,
  getWorkflowsByUserId,
  updateWorkflow,
  deleteWorkflow,
  getDashboardWorkflows,
  getDashboardMetrics,
};
