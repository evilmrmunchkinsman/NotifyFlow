import { Request, Response } from 'express';
import { createNotification } from './notifications.service';
import { z } from 'zod';

const notificationSchema= z.object({
    templateId: z.string().min(1),
    recipient: z.string().email,
    channel:z.enum(['email','sms']),
    payload:z.record(z.string(),z.any()),
});

export const sendNotification= async(req:Request, res:Response) =>{
    try{
        const workspaceId= (req as any).workspace.id;

        const parsedBody= notificationSchema.parse(req.body);

        const notification= await createNotification(workspaceId, parsedBody);

        return res.status(201).json(notification);
    }  catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message });
    }
    return res.status(400).json({ error: error.message });
  }
}