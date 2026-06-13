import { ExecutionContext } from "./type";

export function createExecutionContext(
    executionId: string,
): ExecutionContext {
    return {
        executionId,
        outputs: {},
        variables: {},
        errors: {},
    };
}