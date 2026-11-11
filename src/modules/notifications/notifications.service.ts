import prisma from '../../lib/prisma';
import { notificationQueue } from '../../config/queue';


export const createNotification = async (workspaceId: string, data: any) => {
  // 1. Check if the client sent an idempotency key
  if (data.idempotencyKey) {
    const existing = await prisma.notification.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    
    // If it exists, return the old one and DO NOT queue a new job
    if (existing) {
      console.log('[Service] Idempotency key matched, returning existing.');
      return existing; 
    }
  }

  // 2. Create the new notification
  const notification = await prisma.notification.create({
    data: {
      workspaceId: workspaceId,
      templateId: data.templateId,
      recipient: data.recipient,
      channel: data.channel,
      payload: data.payload,
      idempotencyKey: data.idempotencyKey || null, // Save the key
      status: 'pending',
    },
  });

  // 3. Add to Queue
  await notificationQueue.add('send', {
    notificationId: notification.id,
  });

  return notification;
};


export const getNotifications = async (workspaceId: string, status?: string, channel?: string) => {
  
  const whereClause: any = { workspaceId: workspaceId };
  
  if (status) whereClause.status = status;
  if (channel) whereClause.channel = channel;

  return prisma.notification.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }, // Newest first
    include: {
      events: { orderBy: { createdAt: 'desc' } } // Include the audit trail!
    },
  });
};