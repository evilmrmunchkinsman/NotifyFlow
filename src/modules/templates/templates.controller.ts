import { Request, Response } from 'express';
import { createTemplate, getTemplates, getTemplateById, updateTemplate } from './templates.service';
import { z } from 'zod';

const  templateSchema= z.object({
    name:z.string().min(1),
    channel: z.enum(['email','sms','webhook']),
    subject: z.string().optional(),
    body: z.string().min(1),
});


export const create = async( req:Request, res:Response) =>{
    try{
        const workspaceId= (req as any).workspace.id;

        const parsedBody= templateSchema.parse(req.body);

        const template= await createTemplate(workspaceId,parsedBody);
        return res.status(201).json(template);
    }  catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message });
    }
     return res.status(400).json({ error: error.message });
  }
};


export const list= async (req:Request, res:Response) =>{
    try{
        const workspaceId= (req as any).workspace.id;
        const templates= await getTemplates(workspaceId);
        return res.status(200).json(templates);
    } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


export const getOne= async(req:Request, res:Response) =>{
    try{
        const workspaceId= (req as any).workspace.id;
        const templateId= req.params.id as string;
        const template= await getTemplateById(templateId,workspaceId);
        if(!template){
            return res.status(404).json({ error: 'Template not found' });
        } 
        return res.status(200).json(template);
    } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


export const update= async(req:Request, res:Response) =>{
    try{
        const workspaceId= (req as any).workspace.id;
        const templateId= req.params.id as string;

        const updateSchema= z.object({
            name:z.string().optional(),
            subject:z.string().optional(),
            body:z.string().optional(),
        });
        const parsedBody= updateSchema.parse(req.body);
        const template= await updateTemplate(templateId,workspaceId,parsedBody);
        return res.status(200).json(template);
    } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};