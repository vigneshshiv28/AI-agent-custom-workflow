import cron from "node-cron";
import redis from "@/lib/db/redis";
import { WorkflowQueueMessage } from "./types";

export interface Job{
    userId: string;
    workflowId: string;
    scheduleId: string;
    workflow: any;
}

export interface ScheduledJob extends Job {
    scheduleTime: string; 
}




const STREAM_KEY= process.env.WORKFLOW_EXECUTION_STREAM || ""

async function sendToQueue(payload: WorkflowQueueMessage){
    try{
      
      if(STREAM_KEY === "" ){
        throw new Error("Empty stream key or group name")
      }
  
      const jobId = await redis.xadd(
        STREAM_KEY,
        "*",
        "event",payload.event,
        "data",JSON.stringify(payload.data),
      )
  
      return jobId
    }catch(error){
      console.log("Error sending data to stream", error)
      throw error
    }
}
 

export async function setWorkflowCronJob(cronExpression: string, job: Job) {
    cron.schedule(cronExpression, async () => {
      const now = new Date().toISOString();
      console.log(`Executing job ${job.scheduleId} at ${now}`);
  
      await sendToQueue({
        event: "RUN_WORKFLOW",
        data: {
          userId: job.userId,
          workflowId: job.workflowId,
          scheduleId: job.scheduleId,
          triggeredAt: now,
        }
      });
    });
  }

export async  function setWorkflowScheduledJob(job: ScheduledJob) {
    const delay = new Date(job.scheduleTime).getTime() - Date.now();

    if (delay <= 0) {
        console.warn(`Job ${job.scheduleId} has a past scheduleTime, skipping.`);
        return;
    }

    console.log(`Scheduled one-time job ${job.scheduleId} to run in ${delay} ms`);

    setTimeout(async () => {
        console.log(`Executing one-time job ${job.scheduleId}`);
        await sendToQueue({
        event: "RUN_WORKFLOW",
        data: {
            userId: job.userId,
            workflowId: job.workflowId,
            scheduleId: job.scheduleId,
            triggeredAt: new Date().toISOString(),
        }
        });


    }, delay);
}

