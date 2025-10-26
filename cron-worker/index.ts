import { Hono, Context } from 'hono';
import redis from '@/lib/db/redis';
import prisma from '@/lib/db/prisma';
import { registerJob } from './jobs/register-jobs';

const STREAM_KEY = process.env.WORKFLOW_EXECUTION_STREAM || '';

async function initializeStream() {
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



await initializeStream();
console.log('Server initialization complete');

const app = new Hono();

app.post('/api/jobs/register', registerJob);

export default {
  port: 8080,
  fetch: app.fetch,
};
