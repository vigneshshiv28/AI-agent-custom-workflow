import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/services';
import { z } from 'zod';

const nodeSchema = z.object({
  id: z.string(),
  type: z.string(), 
  data: z.record(z.string(),z.any()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export type Node = z.infer<typeof nodeSchema> 

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export type Edge = z.infer<typeof edgeSchema>

const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

const graphSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  viewport: viewportSchema.optional(),
});

export const workflowSchema = z.object({
  conversation_variables: z.array(z.any()).optional(),
  features: z.record(z.string(),z.any()).optional(),
  graph: graphSchema,
});

export type Workflow = z.infer<typeof workflowSchema>;
 

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  workflow: workflowSchema,
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createWorkflowSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    const workflow = await WorkflowService.createWorkflow(session.user.id, result.data);

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workflows = await WorkflowService.getWorkflowsByUserId(session.user.id);
    return NextResponse.json(workflows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
