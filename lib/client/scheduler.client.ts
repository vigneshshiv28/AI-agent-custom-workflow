export interface registerScheduleJobSchema {
  userId: string;
  workflowId: string;
  scheduleId: string;
  scheduleMode: string;
  cronExpression?: string;
  scheduleTime: string;
  workflow: any;
}

async function registerScheduleJob(body: registerScheduleJobSchema) {
  const schedulerUrl = process.env.SCHEDULER_URL;

  if (!schedulerUrl) {
    console.error('SCHEDULER_URL not configured');
    return;
  }

  try {
    const response = await fetch(`${schedulerUrl}/jobs/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.json();
      console.error('Scheduler API error:', errorText);
      throw new Error(`Scheduler API returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error calling Scheduler API:', error);
    throw error;
  }
}

export const SchedulerClient = {
  registerScheduleJob,
};
