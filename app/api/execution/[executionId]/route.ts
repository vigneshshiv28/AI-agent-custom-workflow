import { z } from 'zod';
import { NextResponse } from 'next/server';
import { WorkflowStatus } from '@/app/generated/prisma/enums';
import { ExecutionService } from '@/lib/services';

const UpdateExecutionSchema = z
  .object({
    status: z.enum(WorkflowStatus).optional(),
    endedAt: z.coerce.date().optional(),
    output: z.any().optional(),
  })
  .refine((data) => data.status || data.endedAt || data.output !== undefined, {
    message: 'At least one field (status, endedAt, or output) must be provided',
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const body = await request.json();
    const result = UpdateExecutionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.issues },
        { status: 400 }
      );
    }

    const { status, endedAt, output } = result.data;
    const { executionId } = await params;

    const execution = await ExecutionService.updateWorkflowExecution(executionId, {
      status,
      endedAt,
      output,
    });

    return NextResponse.json(execution, { status: 200 });
  } catch (error) {
    console.log(error);

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const { executionId } = await params;
    await ExecutionService.deleteWorkflowExecution(executionId);

    return NextResponse.json({ message: 'Execution deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting execution:', error);

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
