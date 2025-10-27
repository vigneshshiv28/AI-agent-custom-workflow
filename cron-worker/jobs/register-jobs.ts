import { z } from "zod";
import { Context } from "hono";
import cron from "node-cron";
import { setWorkflowCronJob, Job } from "../utils";


const registerJobSchema = z.object({
  userId: z.string(),
  workflowId: z.string(),
  scheduleId: z.string(),
  scheduleMode: z.enum(["CRON","INTERVAL","CALENDAR"]),
  cronExpression: z.string().optional(),
  scheduleTime: z.string().optional(),
  workflow: z.any()
});

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

        setWorkflowCronJob(job.cronExpression,{
          userId: job.userId,
          workflowId: job.workflowId,
          scheduleId: job.scheduleId,
          workflow: job.workflow,
        })

  
        return c.json({ message: "Scheduled job successfully", status: 201 });
      } else  {
          return c.json({ message: "Invalid Job request", status: 400 });
              
      }

      } catch (error) {
        console.error(error);
        return c.json({ message: "Internal server error", status: 500 });
    }
  }
