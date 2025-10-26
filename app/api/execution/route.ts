import { z } from 'zod';
import { NextResponse } from 'next/server';
import { WorkflowStatus } from '@/app/generated/prisma/enums';
import { ExecutionService } from '@/lib/services';

const CreateExecutionSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  status: z.enum(WorkflowStatus).optional(),
  output: z.any().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = CreateExecutionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    const { workflowId, status, output } = result.data;

    const execution = await ExecutionService.createWorkflowExecution({
      workflowId,
      status,
      output,
    });

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
