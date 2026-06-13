import { apiFetch } from "@/lib/api/client";
import type { GetDashboardMetricsResponse } from "@/app/api/dashboard/metrics/route";
import type { GetDashboardSummaryResponse } from "@/app/api/dashboard/summary/route";

export type { GetDashboardMetricsResponse, GetDashboardSummaryResponse };

export async function getDashboardMetrics(): Promise<GetDashboardMetricsResponse> {
    return apiFetch<GetDashboardMetricsResponse>("/api/dashboard/metrics");
}

export async function getDashboardSummary(): Promise<GetDashboardSummaryResponse> {
    return apiFetch<GetDashboardSummaryResponse>("/api/dashboard/summary");
}
