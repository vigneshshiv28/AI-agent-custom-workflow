import { z } from 'zod';
import { workflowSchema } from '@/schema/workflow';


export const registerScheduleJobSchema = z.object({
  userId: z.string(),
  workflowId: z.string(),
  scheduleId: z.string(),
  scheduleMode: z.enum(['CRON', 'INTERVAL', 'CALENDAR']),
  cronExpression: z.string().optional(),
  scheduleTime: z.string().optional(),
  workflow: workflowSchema,
});

export type registerScheduleJobSchema = z.infer<typeof registerScheduleJobSchema>;


export interface RegisterJobResponse {
  message: string;
  status: number;
}

const SCHEDULER_BASE_URL = process.env.SCHEDULER_URL ?? 'http://localhost:8080/api';

async function registerScheduleJob(job: registerScheduleJobSchema): Promise<RegisterJobResponse> {
  const url = `${SCHEDULER_BASE_URL}/jobs/register`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(job),
  });

  const data = (await response.json()) as RegisterJobResponse;

  if (!response.ok) {
    throw new Error(
      data?.message ?? `SchedulerRepository: request failed with status ${response.status}`
    );
  }

  return data;
}

export const SchedulerRepository = {
  registerScheduleJob,
};
