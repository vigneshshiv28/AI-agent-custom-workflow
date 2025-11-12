import { Hono } from 'hono';
import { upgradeWebSocket } from 'hono/bun'
import { WSContext,WSReadyState } from 'hono/ws';
import redis from '@/lib/db/redis';
import prisma from '@/lib/db/prisma';
import { DateTime } from 'luxon';
import { registerJob } from './jobs/register-jobs';
import { setWorkflowCronJob,setWorkflowScheduledJob } from './utils';
import { auth } from '@/lib/auth/auth';
import cron from 'node-cron';
import { WorkflowExecutorEvent}  from '@/work-execution-engine/type';


const STREAM_KEY = process.env.WORKFLOW_EXECUTION_STREAM || '';
const EVENT_CHANNEL = process.env.WORKFLOW_EVENT_CHANNEL || '';
const wsConnections = new Map<string, WSContext>();

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

async function intializeRedisSubscriber(){
  if(EVENT_CHANNEL === ""){
    throw new Error("Empty event channel")
  }
  const subscriber = redis.duplicate();
  await subscriber.subscribe(EVENT_CHANNEL)

  redis.on("message", (channel: string, message: string) => {
    try {
      const event: WorkflowExecutorEvent = JSON.parse(message);

      const ws = wsConnections.get(event.userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      } else {
        console.log(` No active WebSocket for user ${event.userId}`);
      }
    } catch (err) {
      console.error("Failed to process Redis event:", err);
    }
  
  });

  console.log(`Redis subscriber ready for ${EVENT_CHANNEL}`);
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
await intializeRedisSubscriber();
await initializeCronJob();
console.log('Server initialization complete');

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null
	}
}>();

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set('user', null);
    c.set('session', null);
    await next();
    return;
  }

  c.set('user', session.user);
  c.set('session', session.session);
  await next();
});

app.use('/ws', async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.text('Unauthorized', 401); 
  }
  await next();
});


app.post('/api/jobs/register', registerJob);

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    const user = c.get('user')!;
    return {
      onOpen(event, ws) {
        wsConnections.set(user.id,ws)
        console.log('User connected:', user.email);
      },
      
      onClose() {
        console.log('Connection closed');
      },
    };
  })
);

export default {
  port: 8080,
  fetch: app.fetch,
};
