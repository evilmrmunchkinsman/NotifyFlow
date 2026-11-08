import { Request, Response } from 'express';
import { logWebhookEvent } from './tracking.service';


export const handleResendWebhook = async( req:Request, res:Response) => {
    try {
        const {type,data} = req.body;
        if(type==='email.delivered' || type==='email.bounced'){
            const status= type === 'email.delivered' ? 'delivered' : 'bounced';

            await logWebhookEvent(data.email_id,status,data.bounce?.message);
        } 
        return res.status(200).json({ received: true });
        
    } catch (error: any) {
    console.error('Webhook Error:', error.message);
    return res.status(200).json({ received: true, error: error.message });
  }
}