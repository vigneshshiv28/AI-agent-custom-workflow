import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/services';
import { z } from 'zod';
import { WorkflowResponse } from '@/shared/contracts/workflow.contract';
import { workflowSchema } from '@/shared/schema/workflow';

export type GetWorkflowByIdResponse = WorkflowResponse;

export type UpdateWorkflowResponse = WorkflowResponse;

const UpdateWorkflowSchema = z.object({
  name: z.string().optional(),
  workflow: workflowSchema.optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { workflowId } = await params;
    const workflow = await WorkflowService.getWorkflowById(workflowId, session.user.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json(workflow, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { workflowId } = await params;

    const body = await request.json();

    const result = UpdateWorkflowSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    if (result.data.workflow) {
      const nodes = result.data.workflow.graph?.nodes ?? [];
      const hasTrigger = nodes.some((node: any) => node?.data?.type === 'Trigger');

      if (!hasTrigger) {
        return NextResponse.json(
          { error: 'Workflow must contain at least one Trigger node' },
          { status: 422 }
        );
      }
    }

    const updatedWorkflow = await WorkflowService.updateWorkflow(
      session.user.id,
      workflowId,
      result.data
    );

    return NextResponse.json(updatedWorkflow, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { workflowId } = await params;

    await WorkflowService.deleteWorkflow(session.user.id, workflowId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
