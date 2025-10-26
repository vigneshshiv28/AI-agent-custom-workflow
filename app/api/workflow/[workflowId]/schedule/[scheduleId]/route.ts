import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { ScheduleService } from '@/lib/services/schedule.service';
import { WorkflowService } from '@/lib/services';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workflowId: string; scheduleId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { workflowId, scheduleId } = await params;

    const schedule = await ScheduleService.getWorkflowScheduleById(scheduleId);
    const workflow = await WorkflowService.getWorkflowById(workflowId, session.user.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (session.user.id !== workflow.userId || schedule.workflow.id !== workflowId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(schedule, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workflowId: string; scheduleId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { workflowId, scheduleId } = await params;
    const schedule = await ScheduleService.getWorkflowScheduleById(scheduleId);
    const workflow = await WorkflowService.getWorkflowById(workflowId, session.user.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (session.user.id !== workflow.userId || schedule.workflow.id !== workflowId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ScheduleService.deleteWorkflowSchedule(scheduleId);

    return NextResponse.json(
      { message: 'Schedule deleted successfully', scheduleId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
