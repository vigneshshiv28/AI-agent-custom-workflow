"use client";

import { useRouter } from "next/navigation";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { Workflow } from "@/schema/workflow";

interface WorkflowCanvasClientProps {
  workflowId: string;
  workflowName: string;
  workflow: Workflow;
  executions?: any[];
}

export function WorkflowCanvasClient({
  workflowId,
  workflowName,
  workflow,
  executions,
}: WorkflowCanvasClientProps) {
  const router = useRouter();

  return (
    <WorkflowCanvas
      workflowId={workflowId}
      workflowName={workflowName}
      workflow={workflow}
      executions={executions}
      onBack={() => router.push("/dashboard")}
    />
  );
}
