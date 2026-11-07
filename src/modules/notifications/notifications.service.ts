import prisma from '../../lib/prisma';
import { notificationQueue } from '../../config/queue';


export const createNotification= async(workspaceId:string, data:any) =>{
    const notification= await prisma.notification.create({
        data:{
            workspaceId:workspaceId,
            templateId:data.templateId,
            channel:data.channel,
            recipient:data.recepient,
            payload:data.payload,
            status:'pending',
        },
    });

    await notificationQueue.add('send',{
        notificationId:notification.id,
    });
    return notification;
}