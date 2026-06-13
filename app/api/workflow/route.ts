import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/services';
import { WorkflowListResponse, WorkflowResponse } from '@/shared/contracts/workflow.contract';

export type GetWorkflowsResponse = WorkflowListResponse[];
export type CreateWorkflowResponse = WorkflowResponse;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workflow = await WorkflowService.createWorkflow(session.user.id);
    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workflows = await WorkflowService.getWorkflowsByUserId(session.user.id);
    return NextResponse.json(workflows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
