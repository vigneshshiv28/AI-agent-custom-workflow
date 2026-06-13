import { WorkflowExecutorEvent } from "./type";
import { ExecutionService } from "@/lib/services";
import { EventPublisher } from "./event-publisher";
import { publisher } from "./event-publisher";

class EventEmitter {
    constructor(
        private readonly publisher: EventPublisher
    ) { }

    async emit(event: WorkflowExecutorEvent) {
        switch (event.type) {
            case "node:start": {
                await ExecutionService.recordNodeStart(
                    event.executionId,
                    event.nodeId,
                    event.nodeType,
                    event.input,
                );
                break;
            }

            case "node:success": {
                await ExecutionService.recordNodeSuccess(
                    event.executionId,
                    event.nodeId,
                    event.nodeType,
                    event.result,
                );
                break;
            }

            case "node:error": {
                await ExecutionService.recordNodeFailure(
                    event.executionId,
                    event.nodeId,
                    event.nodeType,
                    event.error,
                );
                break;
            }

            case "workflow:start": {
                break;
            }

            case "workflow:complete": {
                await ExecutionService.updateWorkflowExecution(
                    event.executionId,
                    {
                        status: "SUCCESS",
                        endedAt: new Date(),
                    },
                );
                break;
            }

            case "workflow:failed": {
                await ExecutionService.updateWorkflowExecution(
                    event.executionId,
                    {
                        status: "FAILED",
                        endedAt: new Date(),
                    },
                );
                break;
            }
        }


        await this.publisher.publish(
            `workflow-events:${event.userId}`,
            event,
        );
    }
}

export const emitter = new EventEmitter(
    publisher,
);