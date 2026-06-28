

export interface NodeStartEvent {
  type: 'node:start';
  executionId: string;
  userId: string;
  workflowId: string;
  nodeId: string;
  nodeType: string;
  input?: unknown;
  timestamp: number;
}

export interface NodeSuccessEvent {
  type: 'node:success';
  executionId: string;
  userId: string;
  workflowId: string;
  nodeId: string;
  nodeType: string;
  result: unknown;
  timestamp: number;
}

export interface NodeErrorEvent {
  type: 'node:error';
  executionId: string;
  userId: string;
  workflowId: string;
  nodeId: string;
  nodeType: string;
  error: string;
  timestamp: number;
}

export interface AgentToolStartEvent {
  type: 'agent:tool:start';
  executionId: string;
  userId: string;
  workflowId: string;
  nodeId: string;
  nodeType: string;
  toolName: string;
  toolInput: Record<string, any>;
  timestamp: number;
}

export interface AgentToolResultEvent {
  type: 'agent:tool:result';
  executionId: string;
  userId: string;
  workflowId: string;
  nodeId: string;
  nodeType: string;
  toolName: string;
  toolOutput: unknown;
  timestamp: number;
}



export interface WorkflowStartEvent {
  type: 'workflow:start';
  executionId: string;
  userId: string;
  workflowId: string;
  timestamp: number;
}

export interface WorkflowCompleteEvent {
  type: 'workflow:complete';
  executionId: string;
  userId: string;
  workflowId: string;
  timestamp: number;
}

export interface WorkflowFailedEvent {
  type: 'workflow:failed';
  executionId: string;
  userId: string;
  workflowId: string;
  error: string;
  timestamp: number;
}



export interface ConnectedEvent {
  type: 'connected';
  userId: string;
}



export interface AgentToolStartEvent {
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

export interface AgentToolResultEvent {
  type: "agent:tool:result";
  executionId: string;
  userId: string;
  workflowId: string;
  nodeId: string;
  nodeType: string;
  toolName: string;
  toolOutput: unknown;
  timestamp: number;
}

export type SSEEvent =
  | NodeStartEvent
  | NodeSuccessEvent
  | NodeErrorEvent
  | WorkflowStartEvent
  | WorkflowCompleteEvent
  | WorkflowFailedEvent
  | ConnectedEvent
  | AgentToolStartEvent
  | AgentToolResultEvent;


export type NodeEventType = 'node:start' | 'node:success' | 'node:error';

export type WorkflowEventType = 'workflow:start' | 'workflow:complete' | 'workflow:failed';
