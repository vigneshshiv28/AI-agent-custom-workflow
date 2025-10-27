import cron from "node-cron";
import redis from "@/lib/db/redis";

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

async function sendToQueue(data: any){
    try{
      
      if(STREAM_KEY === "" ){
        throw new Error("Empty stream key or group name")
      }
  
      const jobId = await redis.xadd(
        STREAM_KEY,
        "*",
        "event",data.event,
        "data",JSON.stringify(data.data),
      )
  
      return jobId
    }catch(error){
      console.log("Error sedning data to stream", error)
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
          workflow: job.workflow
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
            workflow: job.workflow
        }
        });


    }, delay);
}

