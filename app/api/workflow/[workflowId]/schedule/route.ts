import { auth } from '@/lib/auth/auth';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { ScheduleStatus } from '@/app/generated/prisma/enums';
import { ScheduleService, WorkflowService } from '@/lib/services';

const CronScheduleConfigSchema = z.object({
  mode: z.literal('CRON'),
  cronExpression: z.string().min(1, 'Cron expression is required'),
});

const IntervalScheduleConfigSchema = z.object({
  mode: z.literal('INTERVAL'),
  unit: z.enum(['MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS']),
  value: z.number().int().positive('Interval value must be positive'),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format')
    .optional(),
});

const CalendarScheduleConfigSchema = z.object({
  mode: z.literal('CALENDAR'),
  dateTime: z.coerce.date(),
});

const ScheduleTypeSchema = z.discriminatedUnion('mode', [
  CronScheduleConfigSchema,
  IntervalScheduleConfigSchema,
  CalendarScheduleConfigSchema,
]);

export const CreateWorkflowScheduleSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
  status: z.enum(ScheduleStatus),
  type: ScheduleTypeSchema,
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = CreateWorkflowScheduleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    const userId = session.user.id;
    const { workflowId } = await params;

    const workflow = await WorkflowService.getWorkflowById(workflowId, userId);
    if (!workflow || workflow.userId !== userId) {
      return NextResponse.json({ error: 'Workflow not found or unauthorized' }, { status: 403 });
    }

    const schedule = await ScheduleService.createWorkflowSchedule({
      ...result.data,
      workflowId,
    });
    // Ideally this should just pub-sub model but for simplicity this is an api call for now

    const jobBody = {
      userId: session.user.id,
      workflowId: workflowId,
      scheduleId: schedule.id,
      scheduleMode: schedule.type,
      workflow: workflow.workflow,
    };

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
