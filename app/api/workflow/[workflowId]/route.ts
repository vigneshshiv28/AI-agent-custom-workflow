import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/services';
import { z } from 'zod';

const UpdateWorkflowSchema = z.object({
  name: z.string().optional(),
  workflow: z.any().optional(),
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
