import { NextResponse } from "next/server";
import { WorkflowService } from "@/lib/services/workflow.service";
import { auth } from '@/lib/auth/auth';
import { WorkflowListResponse } from '@/shared/contracts/workflow.contract';

export type GetDashboardSummaryResponse = WorkflowListResponse[];

export async function GET(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const dashboardSummary = await WorkflowService.getDashboardWorkflows(session.user.id);
        return NextResponse.json(dashboardSummary, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}