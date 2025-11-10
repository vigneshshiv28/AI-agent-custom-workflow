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
    };
