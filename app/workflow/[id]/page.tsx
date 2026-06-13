import React from 'react';
import { Workflow } from '@/schema/workflow';
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation";
import { headers } from 'next/headers';
import { getWorkflowById } from '@/lib/services';
import { ExecutionService } from '@/lib/services/execution.service';
import { WorkflowCanvasClient } from './WorkflowCanvasClient';

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  if (!id || !session?.user.id) {
    redirect("/dashboard");
  }

  try {
    const workflowResponse = await getWorkflowById(id, session.user.id);
    const executions = await ExecutionService.getExecutionsByWorkflowId(id, 50);

    const workflowName = workflowResponse.name;
    const workflow = workflowResponse.workflow as Workflow;

    return (
      <WorkflowCanvasClient
        workflowId={id}
        workflowName={workflowName}
        workflow={workflow}
        executions={executions}
      />
    );
  } catch {
    redirect('/dashboard');
  }
}