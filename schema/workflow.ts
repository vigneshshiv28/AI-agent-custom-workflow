import { z } from 'zod';

export const nodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.string(), z.any()),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export type Node = z.infer<typeof nodeSchema>

export const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  data: z.object({
    branchPath: z.enum(["true", "false"]).optional(),
  }).optional(),
});

export type Edge = z.infer<typeof edgeSchema>

export const viewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

export const graphSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  viewport: viewportSchema.optional(),
});

export type Graph = z.infer<typeof graphSchema>

export const workflowSchema = z.object({
  conversation_variables: z.array(z.any()).optional(),
  features: z.record(z.string(), z.any()).optional(),
  graph: graphSchema,
});

export type Workflow = z.infer<typeof workflowSchema>;