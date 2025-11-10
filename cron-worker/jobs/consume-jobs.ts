import redis from '@/lib/db/redis';
import { WorkflowService } from '@/lib/services';
import { ExecutionService, CreateWorkflowExecutionData } from '@/lib/services';
import { workflowSchema } from '@/app/api/workflow/route';
import { WorkflowQueueMessage } from '../types';
import { WorkflowExecutor } from "@/work-execution-engine/workflow-executor"
import { WorkflowExecutorEvent } from '@/work-execution-engine/type';


const STREAM_KEY = process.env.WORKFLOW_EXECUTION_STREAM || '';
const WORKERS_COUNT = parseInt(process.env.WORKFLOW_WORKER_COUNT || '10');
const GROUP_NAME = process.env.WORKFLOW_EXECUTION_GROUP || '';
const EVENT_CHANNEL = process.env.WORKFLOW_EVENT_CHANNEL || ""


async function emitter(event: WorkflowExecutorEvent) {
  switch (event.type) {
    case "node:start":
      await ExecutionService.recordNodeStart(
        event.executionId,
        event.nodeId,
        event.nodeType,
        event.input
      );
      break;

    case "node:success":
      await ExecutionService.recordNodeSuccess(
        event.executionId,
        event.nodeId,
        event.nodeType,
        event.result
      );
      break;

    case "node:error":
      await ExecutionService.recordNodeFailure(
        event.executionId,
        event.nodeId,
        event.nodeType,
        event.error
      );
      break;
    
   }

   await redis.publish(EVENT_CHANNEL, JSON.stringify(event));
}


async function execute_workflow(workflowId: string, userId: string) {
  try{

    const workflow = await WorkflowService.getWorkflowById(workflowId,userId)

    const workflowExecution:CreateWorkflowExecutionData = {
      workflowId: workflow.id,
      status: "RUNNING",
    }
  
    const executingWorkflow = await ExecutionService.createWorkflowExecution(workflowExecution)
    console.log('executing workflow...', workflow.id);
  
    const parsedWorkflow = workflowSchema.parse(workflow.workflow);
    const workflowExecutor = new WorkflowExecutor(workflow.id,parsedWorkflow,workflow.userId,executingWorkflow.id,emitter)
    await workflowExecutor.executeWorkflow()
    
    console.log("Workflow executed successfully")  
  }catch(error){
    console.log(error)
    throw(error)
  }

}

async function initializeConsumerGroup() {
  try {
    if (STREAM_KEY === '' || GROUP_NAME === '') {
      throw new Error('Empty stream key or group name');
    }

    try {
      await redis.xinfo('STREAM', STREAM_KEY);
    } catch (error) {
      await redis.xadd(STREAM_KEY, '*', 'init', 'true');
      console.log(`Stream ${STREAM_KEY} created`);
    }

    try {
      await redis.xgroup('CREATE', STREAM_KEY, GROUP_NAME, '0', 'MKSTREAM');
      console.log(`Consumer group ${GROUP_NAME} created`);
    } catch (error: any) {
      if (error.message && error.message.includes('BUSYGROUP')) {
        console.log(`Consumer group ${GROUP_NAME} already exists`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error initializing consumer group:', error);
    throw error;
  }
}

async function worker(workerId: number) {
  const consumerName = `worker-${workerId}`;
  try {
    while (true) {
      const messages: Array<any> = await redis.xreadgroup(
        'GROUP',
        GROUP_NAME,
        consumerName,
        'COUNT',
        1,
        'BLOCK',
        5000,
        'STREAMS',
        STREAM_KEY,
        '>'
      );

      if (messages && messages.length > 0) {
        for (const [streamId, entries] of messages) {
          for (const [messageId, rawFields] of entries) {
            const fields: any = {};
            for (let i = 0; i < rawFields.length; i += 2) {
              fields[rawFields[i]] = rawFields[i + 1];
            }

            const { event, data } = fields;
            const parsedData: WorkflowQueueMessage['data'] = JSON.parse(data as string);

            console.log(`[Worker ${workerId}] Processing:`, {
              messageId,
              event,
              userId: parsedData.userId,
              workflowId: parsedData.workflowId,
              scheduleId: parsedData.scheduleId,
            });

            await execute_workflow(parsedData.workflowId,parsedData.userId);

            await redis.xack(STREAM_KEY, GROUP_NAME, messageId);
          }      
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

await initializeConsumerGroup();

const workers = Array.from({ length: WORKERS_COUNT }, (_, i) => worker(i + 1));

await Promise.all(workers);
