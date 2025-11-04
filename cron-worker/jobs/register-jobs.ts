import { z } from "zod";
import { Context } from "hono";
import cron from "node-cron";
import { setWorkflowCronJob, Job , setWorkflowScheduledJob} from "../utils";
import { DateTime } from 'luxon';
import { workflowSchema } from "@/app/api/workflow/route";


const registerJobSchema = z.object({
  userId: z.string(),
  workflowId: z.string(),
  scheduleId: z.string(),
  scheduleMode: z.enum(["CRON","INTERVAL","CALENDAR"]),
  cronExpression: z.string().optional(),
  scheduleTime: z.string().optional(),
  workflow: workflowSchema,
});

export async function registerJob(c: Context) {
    const body = await c.req.json();
    const result = registerJobSchema.safeParse(body);
    
    console.log("Recieve req to schedule job")
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

       
      } else if(job.scheduleMode === "CALENDAR") {

        console.log(`Scheduling calender jobs at ${job.scheduleTime}`)
        if(!job.scheduleTime){
          return c.json({ message: "Invalid Job request", status: 400})
        }



        const now = DateTime.now().setZone("UTC");
        const endOfDay = now.endOf("day")
        const jobTime = DateTime.fromISO(job.scheduleTime, { zone: "UTC" });

        if(jobTime < endOfDay){
          setWorkflowScheduledJob({
            userId: job.userId,
            workflowId: job.workflowId,
            scheduleId: job.scheduleId,
            workflow: job.workflow,
            scheduleTime: job.scheduleTime
          })

          console.log("Schedule job successfully")

          return c.json({ message: "Scheduled job successfully", status: 201 });
        } else {

          console.log("Job will be schedule later")
          return c.json({message:"Job will schedule later", status: 201})
        } 
      } else {
        console.log("Unable to schedule job")
        return c.json({ message: "Invalid Job request", status: 400 });
      }

      } catch (error) {
        console.error(error);
        return c.json({ message: "Internal server error", status: 500 });
    }
  }
