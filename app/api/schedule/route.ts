import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { ScheduleService } from '@/lib/services/schedule.service';

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const schedules = await ScheduleService.getWorkflowSchedulesByUserId(session.user.id);
    return NextResponse.json(schedules, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
