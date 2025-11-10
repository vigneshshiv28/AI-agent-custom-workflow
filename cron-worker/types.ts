export interface WorkflowQueueMessage {
    event: "RUN_WORKFLOW";
    data: {
      workflowId: string;
      userId: string;
      scheduleId?: string;
      triggeredAt: string;
    };
  } 