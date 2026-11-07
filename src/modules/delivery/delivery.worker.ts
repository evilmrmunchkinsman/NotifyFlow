import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { Resend } from 'resend';
import prisma from '../../lib/prisma';
import { renderTemplate } from '../../utils/template.engine';


const redisConnection= new Redis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest:null,
});

const resend= new Resend(process.env.RESEND_API_KEY);

export const deliveryWorker= new Worker(
    'notifications',
    async(job) =>{
        const {notificationId}= job.data;
        console.log(`[Worker] Processing notification: ${notificationId}`)

        const notification= await prisma.notification.findUnique({
            where:{id:notificationId},
            include:{template:true},
        });
        if (!notification || !notification.template) {
      throw new Error('Notification or Template not found');
    }

    const {template, recipient,payload}=notification;

    const data= payload as Record<string,any>;
    const renderBody= renderTemplate(template.body,data);
    const renderedSubject= template.subject? renderTemplate(template.subject, data): 'no subject';


    //send via respond
    if(notification.channel==='email'){
        try{
            const response= await resend.emails.send({
                from:'onboarding@resend.dev',
                to:recipient,
                subject:renderedSubject,
                html:renderBody,
            });

            //success
            await prisma.deliveryEvent.create({
                data:{
                    notificationId:notification.id,
                    status:'sent',
                    provider:'resend',
                    providerMsgId:response.data?.id || null,
                },
            });

            await prisma.notification.update({
                where:{id:notification.id},
                data:{status:'sent'},
            });
            console.log(`[Worker] Email sent successfully to ${recipient}`);
        } catch (error: any) {
        // Log Failure
        await prisma.deliveryEvent.create({
          data: {
            notificationId: notification.id,
            status: 'failed',
            provider: 'resend',
            errorMessage: error.message,
          },
        });
        throw error;
    }
}
 },
    {connection:redisConnection}
);
deliveryWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});
