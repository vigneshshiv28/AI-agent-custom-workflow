import { apiFetch } from "@/lib/api/client";
import type { JsonValue } from "@/lib/api/types";
import type { CreateExecutionResponse } from "@/app/api/execution/route";
import type { UpdateExecutionResponse } from "@/app/api/execution/[executionId]/route";


export type { CreateExecutionResponse, UpdateExecutionResponse };

export interface CreateExecutionBody {
  workflowId: string;
  status?: "RUNNING" | "SUCCESS" | "FAILED";
  output?: JsonValue;
}

export interface UpdateExecutionBody {
  status?: "RUNNING" | "SUCCESS" | "FAILED";
  endedAt?: string;
  output?: JsonValue;
}


export async function createExecution(body: CreateExecutionBody): Promise<CreateExecutionResponse> {
  return apiFetch<CreateExecutionResponse>("/api/execution", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateExecution(
  executionId: string,
  body: UpdateExecutionBody
): Promise<UpdateExecutionResponse> {
  return apiFetch<UpdateExecutionResponse>(`/api/execution/${executionId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteExecution(executionId: string): Promise<void> {
  return apiFetch<void>(`/api/execution/${executionId}`, {
    method: "DELETE",
  });
}
