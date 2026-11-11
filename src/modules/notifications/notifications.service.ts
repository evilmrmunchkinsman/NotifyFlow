import prisma from '../../lib/prisma';
import { notificationQueue } from '../../config/queue';


export const createNotification= async(workspaceId:string, data:any) =>{
    const notification= await prisma.notification.create({
        data:{
            workspaceId:workspaceId,
            templateId:data.templateId,
            channel:data.channel,
            recipient:data.recipient,
            payload:data.payload,
            status:'pending',
        },
    });

    await notificationQueue.add('send',{
        notificationId:notification.id,
    });
    return notification;
}


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