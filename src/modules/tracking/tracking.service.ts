import prisma from '../../lib/prisma';


export const logWebhookEvent = async(providerMsgId: string, status:string, errorMessage?: string) =>{
     const notification = await prisma.notification.findFirst({
        where:{
            events:{
                some:{providerMsgId:providerMsgId}
            }
        }
     });

     if(!notification){
        throw new Error('Notification not found for this provider message ID');
     } 

     let recipientDomain= null;
     let recipientAreaVode= null;

     if(notification.channel==='email'){
        recipientDomain= notification.recipient.split('@')[1]  || null;
     } else if(notification.channel=== 'sms'){
        recipientAreaVode= notification.recipient.substring(0,3) || null;
     } 
     const hourOfDayUtc= new Date().getUTCHours();

     await prisma.deliveryEvent.create({
        data:{
            notificationId:notification.id,
            status:status,
            provider:notification.channel==='email'? 'resend' : 'fast2sms',
            providerMsgId:providerMsgId,
            errorMessage: errorMessage || null,
            channel: notification.channel,
            recipientDomain:recipientDomain,
            recipientAreaCode:recipientAreaVode,
            hourOfDayUtc:hourOfDayUtc,
        }
     });

     await prisma.notification.update({
        where:{id:notification.id},
        data:{status:status}
     });
    return { success: true };
}
