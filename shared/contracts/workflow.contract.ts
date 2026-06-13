import { Workflow } from '../schema/workflow';

export interface CreateWorkflowRequest {
  name: string;
  workflow: Workflow;
}

export interface UpdateWorkflowRequest {
  name?: string;
  workflow?: Workflow;
}

export interface UserDetail {
  id: string;
  name: string | null;
  email: string;
}

export interface WorkflowResponse {
  id: string;
  name: string;
  userId: string;
  workflow: Workflow;
  createdAt: Date;
  updatedAt: Date;
  user?: UserDetail;
}

// expand this later with specific responses for lists vs details
export type WorkflowListResponse = Omit<WorkflowResponse, 'workflow'> & {
  _count?: {
    Executions: number;
    Schedules: number;
  };
  Executions?: {
    id: string;
    status: 'RUNNING' | 'SUCCESS' | 'FAILED';
    startedAt: Date;
    endedAt: Date | null;
  }[];
  Schedules?: {
    id: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
    type: 'CRON' | 'INTERVAL' | 'CALENDAR';
    nextRunAt: Date;
  }[];
};

export interface DashboardMetricsResponse {
  totalWorkflows: number;
  activeSchedules: number;
  recentExecutionsCount: number;
  successRate: number;
  failedExecutionsCount: number;
  recentExecutionsFeed: {
    id: string;
    status: 'RUNNING' | 'SUCCESS' | 'FAILED';
    startedAt: Date;
    workflow: {
      id: string;
      name: string;
    };
  }[];
}
