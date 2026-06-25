export interface AgentNodeOutput {
  text: string;
  data: Record<string, any>;
}

export interface ConditionNodeOutput {
  branch: "true" | "false";
  output: AgentNodeOutput;
}



export type WorkflowExecutorEvent =
  | {
    type: "node:start";
    executionId: string;
    userId: string;
    workflowId: string;
    nodeId: string;
    nodeType: string;
    input?: any;
    timestamp: number;
  }
  | {
    type: "node:success";
    executionId: string;
    userId: string;
    workflowId: string;
    nodeId: string;
    nodeType: string;
    result: AgentNodeOutput | ConditionNodeOutput;
    timestamp: number;
  }
  | {
    type: "node:error";
    executionId: string;
    userId: string;
    workflowId: string;
    nodeId: string;
    nodeType: string;
    error: string;
    timestamp: number;
  }
  | {
    type: "workflow:start";
    executionId: string;
    userId: string;
    workflowId: string;
    timestamp: number;
  }
  | {
    type: "workflow:complete";
    executionId: string;
    userId: string;
    workflowId: string;
    timestamp: number;
  }
  | {
    type: "workflow:failed";
    executionId: string;
    userId: string;
    workflowId: string;
    error: string;
    timestamp: number;
  }
  | {
    type: "agent:tool:start";
    executionId: string;
    userId: string;
    workflowId: string;
    nodeId: string;
    nodeType: string;
    toolName: string;
    toolInput: Record<string, any>;
    timestamp: number;
  }
  | {
    type: "agent:tool:result";
    executionId: string;
    userId: string;
    workflowId: string;
    nodeId: string;
    nodeType: string;
    toolName: string;
    toolOutput: unknown;
    timestamp: number;
  };


export interface ExecutionContext {
  executionId: string;

  outputs: Record<string, any>;

  variables: Record<string, any>;

  errors: Record<string, string>;

  emit: (event: WorkflowExecutorEvent) => Promise<void>;
}

export class NodeError extends Error {
  readonly nodeId: string;
  readonly nodeType: string;
  readonly cause?: unknown;

  constructor(message: string, nodeId: string, nodeType: string, cause?: unknown) {
    super(message);
    this.name = "NodeError";
    this.nodeId = nodeId;
    this.nodeType = nodeType;
    this.cause = cause;
  }
}

export function toNodeError(error: unknown, nodeId: string, nodeType: string): NodeError {
  if (error instanceof NodeError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new NodeError(message, nodeId, nodeType, error);
}
