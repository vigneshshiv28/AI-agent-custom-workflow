import { apiFetch } from "@/lib/api/client";
import type { GetSchedulesResponse } from "@/app/api/schedule/route";
import type { CreateScheduleResponse } from "@/app/api/workflow/[workflowId]/schedule/route";

export type { GetSchedulesResponse, CreateScheduleResponse };


export type ScheduleListItem = GetSchedulesResponse[number];


type CronConfig = { mode: "CRON"; cronExpression: string };
type IntervalConfig = { mode: "INTERVAL"; unit: "MINUTES" | "HOURS" | "DAYS" | "WEEKS" | "MONTHS"; value: number; time?: string };
type CalendarConfig = { mode: "CALENDAR"; dateTime: string };

export interface CreateScheduleBody {
  timezone: string;
  status: "ACTIVE" | "INACTIVE" | "PAUSED";
  type: CronConfig | IntervalConfig | CalendarConfig;
}

export interface UpdateScheduleBody {
  timezone?: string;
  isSchedule?: boolean;
  type?: CronConfig | IntervalConfig | CalendarConfig;
}


export async function getSchedules(): Promise<GetSchedulesResponse> {
  return apiFetch<GetSchedulesResponse>("/api/schedule");
}

export async function createSchedule(
  workflowId: string,
  body: CreateScheduleBody
): Promise<CreateScheduleResponse> {
  return apiFetch<CreateScheduleResponse>(`/api/workflow/${workflowId}/schedule`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
