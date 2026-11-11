import { Request, Response } from 'express';
import { createNotification,getNotifications } from './notifications.service';
import { z } from 'zod';


const notificationSchema= z.object({
    templateId: z.string().min(1),
    recipient: z.string().min(1),
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


export const listNotifications = async (req: Request, res: Response) => {
  try {
    const workspaceId = (req as any).workspace.id;
    const status = req.query.status as string | undefined;
    const channel = req.query.channel as string | undefined;

    const notifications = await getNotifications(workspaceId, status, channel);
    
    return res.status(200).json(notifications);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};