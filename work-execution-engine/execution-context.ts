import { ExecutionContext, WorkflowExecutorEvent } from "./type";

export function createExecutionContext(
    executionId: string,
    userId: string,
    workflowId: string,
    emit: (event: WorkflowExecutorEvent) => Promise<void>,
): ExecutionContext {
    return {
        executionId,
        outputs: {},
        variables: { userId, workflowId },
        errors: {},
        emit,
    };
}