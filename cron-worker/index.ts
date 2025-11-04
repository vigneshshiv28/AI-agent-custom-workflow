import { Hono } from 'hono';
import redis from '@/lib/db/redis';
import prisma from '@/lib/db/prisma';
import { DateTime } from 'luxon';
import { registerJob } from './jobs/register-jobs';
import { setWorkflowCronJob,setWorkflowScheduledJob } from './utils';
import cron from 'node-cron';


const STREAM_KEY = process.env.WORKFLOW_EXECUTION_STREAM || '';

async function initializeRedisStream() {
  try {
    if (STREAM_KEY === '') {
      throw new Error('Empty stream key or group name');
    }

    try {
      await redis.xinfo('STREAM', STREAM_KEY);
    } catch (error) {
      await redis.xadd(STREAM_KEY, '*', 'init', 'true');
      console.log(`Stream ${STREAM_KEY} created`);
    }
  } catch (error) {
    console.error('Error initializing stream:', error);
  }
}

async function initializeCronJob() {
 
  cron.schedule(
    "0 0 * * *", 
    async () => {
      console.log("Running daily workflow scheduling job at midnight UTC");
      await scheduleWorkflowJobs();
    },
    {
      timezone: "UTC", 
    }
  );
}

async function scheduleWorkflowJobs(){
  try{
    const cronSchedules = await prisma.workflowSchedule.findMany({
      where:{
        type: { in: ["CRON", "INTERVAL"] },
      },
      include:{workflow: true}
    })

    const now = DateTime.now().setZone("UTC");
    const endOfDay = now.endOf("day");
    
    const calSchedules = await prisma.workflowSchedule.findMany({
      where:{
        isScheduled: false, 
        type:"CALENDAR",
        nextRunAt: {
          gte: now.toJSDate(),       
          lte: endOfDay.toJSDate(),  
        },
      },
      include:{
        workflow:true
      }
    })

    
    for (const schedule of cronSchedules) {
      try {
        if(!schedule.cronExpression){
          console.log("Empty cron expression")
          continue
        }
        await setWorkflowCronJob(schedule.cronExpression, {
          userId: schedule.workflow.userId,
          workflowId: schedule.workflowId,
          scheduleId: schedule.id,
          workflow: schedule.workflow.workflow,
        });
        

        await prisma.workflowSchedule.update({
          where: { id: schedule.id },
          data: { isScheduled: true }
        });
        
        console.log(`Scheduled cron job: ${schedule.id}`);
      } catch (error) {
        console.error(`Failed to schedule cron job ${schedule.id}:`, error);
      }
    }

    
    for (const schedule of calSchedules) {
      try {
        await setWorkflowScheduledJob({
          userId: schedule.workflow.userId,
          workflowId: schedule.workflowId,
          scheduleId: schedule.id,
          workflow: schedule.workflow.workflow,
          scheduleTime: schedule.nextRunAt.toISOString()
        });
        
        
        await prisma.workflowSchedule.update({
          where: { id: schedule.id },
          data: { isScheduled: true }
        });
        
        console.log(`Scheduled calendar job: ${schedule.id}`);
      } catch (error) {
        console.error(`Failed to schedule calendar job ${schedule.id}:`, error);
      }
    }

    console.log(`Initialized ${cronSchedules.length} cron jobs and ${calSchedules.length} calendar jobs`);

  }catch(error){
    console.log("Failed to initialize cronjobs", error)
  }
}



await scheduleWorkflowJobs()
await initializeRedisStream();
await initializeCronJob();
console.log('Server initialization complete');

const app = new Hono();

app.post('/api/jobs/register', registerJob);

export default {
  port: 8080,
  fetch: app.fetch,
};
