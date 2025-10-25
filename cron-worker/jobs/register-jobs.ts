import { z } from "zod";
import { Context } from "hono";
import cron from "node-cron";
import redis from "@/lib/db/redis";

const registerJobSchema = z.object({
  userId: z.string(),
  workflowId: z.string(),
  scheduleId: z.string(),
  scheduleMode: z.string(),
  cronExpression: z.string().optional(),
  scheduleTime: z.string().optional(),
  workflow: z.any()
});

const STREAM_KEY="workflow:queue"



async function sendToQueue(data: any){
  try{
    redis.xadd(
      STREAM_KEY,
      "*",
      "event",data.event,
      "data",JSON.stringify(data.data),
    )
  }catch(error){
    return error
  }
}


export async function registerJob(c: Context) {
    const body = await c.req.json();
    const result = registerJobSchema.safeParse(body);
  
    if (!result.success) {
      return c.json({
        message: "Invalid Request Schema",
        error: result.error.message,
        status: 400
      });
    }
  
    const job = result.data;
  
    try {
      if (job.scheduleMode === "INTERVAL" || job.scheduleMode === "CRON") {
        if (!job.cronExpression || !cron.validate(job.cronExpression)) {
          return c.json({
            message: "Invalid cron expression",
            status: 400
          });
        }
  
        cron.schedule(job.cronExpression, async () => {
          console.log(`Executing job ${job.scheduleId}`);
          
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
        });
  
        return c.json({ message: "Cron job registered", status: 200 });
  
      } else if (job.scheduleMode === "CALENDER") {
        if (!job.scheduleTime) {
          return c.json({ message: "Missing scheduleTime", status: 400 });
        }
  
        const delay = new Date(job.scheduleTime).getTime() - Date.now();

        console.log("delay",delay)
        if (delay <= 0) {
          return c.json({ message: "Schedule time must be in the future", status: 400 });
        }
  
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
            
        return c.json({ message: "Calendar job registered", status: 200 });
      }
    } catch (error) {
      console.error(error);
      return c.json({ message: "Internal server error", status: 500 });
    }
  }
