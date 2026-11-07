import { Queue } from 'bullmq';
import Redis from 'ioredis';


const connection = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});


export const notificationQueue = new Queue('notifications', { connection });