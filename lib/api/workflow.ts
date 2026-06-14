import { apiFetch } from "@/lib/api/client";
import type { GetWorkflowsResponse, CreateWorkflowResponse } from "@/app/api/workflow/route";
import type { GetWorkflowByIdResponse, UpdateWorkflowResponse } from "@/app/api/workflow/[workflowId]/route";
import type { Workflow } from '@/shared/schema/workflow';


export type { GetWorkflowsResponse, CreateWorkflowResponse, GetWorkflowByIdResponse, UpdateWorkflowResponse };

export type WorkflowListItem = GetWorkflowsResponse[number];

export interface UpdateWorkflowBody {
    name?: string;
    workflow?: { graph: Workflow['graph'] };
}

export async function getWorkflows(): Promise<GetWorkflowsResponse> {
    return apiFetch<GetWorkflowsResponse>("/api/workflow");
}

export async function getWorkflowById(workflowId: string): Promise<GetWorkflowByIdResponse> {
    return apiFetch<GetWorkflowByIdResponse>(`/api/workflow/${workflowId}`);
}

export async function createWorkflow(): Promise<CreateWorkflowResponse> {
    return apiFetch<CreateWorkflowResponse>("/api/workflow", {
        method: "POST",
    });
}

export async function runWorkflow(workflowId: string): Promise<{ message: string; messageId: string; triggeredAt: string }> {
    return apiFetch(`/api/workflow/${workflowId}/run`, {
        method: 'POST',
    });
}

export async function updateWorkflow(
    workflowId: string,
    body: UpdateWorkflowBody
): Promise<UpdateWorkflowResponse> {
    return apiFetch<UpdateWorkflowResponse>(`/api/workflow/${workflowId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}