import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { Resend } from 'resend';
import prisma from '../../lib/prisma';
import { renderTemplate } from '../../utils/template.engine';
import axios from 'axios'; 

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

        const {template, recipient, payload}=notification;

        const data= payload as Record<string,any>;
        const renderedBody= renderTemplate(template.body,data); 
        const renderedSubject= template.subject? renderTemplate(template.subject, data): 'no subject';

        //email        
        if(notification.channel==='email'){
            try{
                const response= await resend.emails.send({
                    from:'onboarding@resend.dev',
                    to:recipient,
                    subject:renderedSubject,
                    html:renderedBody, 
                });

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
        
        //sms
        else if (notification.channel === 'sms') {
            try {
                let cleanNumber = recipient.replace(/\D/g, '');
                if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
                    cleanNumber = cleanNumber.substring(2);
                }

                const response = await axios.post(
                    'https://www.fast2sms.com/dev/bulkV2',
                    {
                        route: 'q',
                        message: renderedBody,
                        numbers: cleanNumber,
                    },
                    {
                        headers: {
                            'Authorization': process.env.FAST2SMS_API_KEY as string,
                        },
                    }
                );

                const result = response.data;
                
                if (!result.return) {
                    throw new Error(result.message || 'Fast2SMS failed to send');
                }
                
                const providerMsgId = result.request_id || `f2s_${Date.now()}`;

                await prisma.deliveryEvent.create({
                    data: {
                        notificationId: notification.id,
                        status: 'sent',
                        provider: 'fast2sms',
                        providerMsgId: providerMsgId,
                    },
                });

                await prisma.notification.update({
                    where: { id: notification.id },
                    data: { status: 'sent' },
                });
                console.log(`[Worker] SMS sent successfully to ${recipient}`);
            } catch (error: any) {
                await prisma.deliveryEvent.create({
                    data: {
                        notificationId: notification.id,
                        status: 'failed',
                        provider: 'fast2sms',
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
