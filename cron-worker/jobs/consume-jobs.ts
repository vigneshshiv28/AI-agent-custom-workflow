import redis from '@/lib/db/redis';
import { ExecutionService, CreateWorkflowExecutionData } from '@/lib/services';
import { Workflow } from '@/app/api/workflow/route';

const STREAM_KEY = process.env.WORKFLOW_EXECUTION_STREAM || '';
const WORKERS_COUNT = parseInt(process.env.WORKFLOW_WORKER_COUNT || '10');
const GROUP_NAME = process.env.WORKFLOW_EXECUTION_GROUP || '';

interface WorkflowData{
  workflowId: string,
  workflow: Workflow,
  status:   "RUNNING" | "SUCCESS" | "FAILED"
}

async function execute_workflow(workflow: WorkflowData) {

  const workflowExecution:CreateWorkflowExecutionData = {
    workflowId: workflow.workflowId,
    status: workflow.status,

  }

  const executingWorkflow = await ExecutionService.createWorkflowExecution(workflowExecution)


  console.log('executing workflow...', workflow.workflowId);
    
  setTimeout(async () => {
    console.log("Workflow Execution completed")
    await ExecutionService.updateWorkflowExecution(executingWorkflow.id,{status:"SUCCESS"})  
  }, 5000);

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
            const parsedData = JSON.parse(data);

            console.log(`[Worker ${workerId}] Processing:`, {
              messageId,
              event,
              userId: parsedData.userId,
              workflowId: parsedData.workflowId,
              scheduleId: parsedData.scheduleId,
            });

            await execute_workflow(parsedData);

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
