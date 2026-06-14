import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import redis from '@/lib/db/redis';
import { WorkflowService } from '@/lib/services';

const STREAM_KEY = process.env.WORKFLOW_EXECUTION_STREAM || '';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (STREAM_KEY === '') {
    return NextResponse.json(
      { error: 'Workflow execution stream is not configured' },
      { status: 500 }
    );
  }

  try {
    const { workflowId } = await params;
    const userId = session.user.id;

    const workflow = await WorkflowService.getWorkflowById(workflowId, userId);
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const triggeredAt = new Date().toISOString();

    const messageId = await redis.xadd(
      STREAM_KEY,
      '*',
      'event', 'RUN_WORKFLOW',
      'data', JSON.stringify({
        workflowId,
        userId,
        triggeredAt,
      })
    );

    return NextResponse.json(
      { message: 'Workflow queued for execution', messageId, triggeredAt },
      { status: 202 }
    );
  } catch (error) {
    console.error('Failed to queue workflow execution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
