import {
  WorkflowRepository,
  UserRepository,
  CreateWorkflowData,
  UpdateWorkflowData,
} from '../repositories';

async function createWorkflow(userId: string, workflow: CreateWorkflowData) {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const existingWorkflow = await WorkflowRepository.findWorkflowByUserIdAndName(
    userId,
    workflow.name
  );

  if (existingWorkflow) {
    throw new Error('Workflow with this name already exists');
  }

  if (!workflow.name) {
    throw new Error('Name is required');
  }

  if (!workflow.workflow) {
    throw new Error('Workflow is required');
  }

  const newWorkflow = await WorkflowRepository.createWorkflow(userId, workflow);

  return newWorkflow;
}

export async function getWorkflowById(workflowId: string, userId: string) {
  const workflow = await WorkflowRepository.findWorkflowById(workflowId);

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  if (workflow.userId !== userId) {
    throw new Error('Workflow not found');
  }

  return workflow;
}

async function getWorkflowsByUserId(userId: string) {
  const user = await UserRepository.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const workflows = await WorkflowRepository.findWorkflowsByUserId(userId);

  return workflows;
}

async function updateWorkflow(userId: string, id: string, workflow: UpdateWorkflowData) {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const existingWorkflow = await WorkflowRepository.findWorkflowById(id);

  if (!existingWorkflow || userId !== existingWorkflow.userId) {
    throw new Error('Workflow does not exist');
  }

  const updatedWorkflow = await WorkflowRepository.updateWorkflow(id, workflow);

  return updatedWorkflow;
}

export const WorkflowService = {
  createWorkflow,
  getWorkflowById,
  getWorkflowsByUserId,
  updateWorkflow,
};
