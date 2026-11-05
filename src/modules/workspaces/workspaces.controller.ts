import { Request, Response } from 'express';
import { createWorkspace, getUserWorkspaces, createApiKey } from './workspaces.service';
import { z } from 'zod';


const createWorkspaceSchema= z.object({
    name: z.string().min(1),
});

const createApiKeySchema= z.object({
    name:z.string().min(1),
})

export const createNewWorkspace= async(req:Request, res:Response)=>{
    try{
        const userId= (req as any).user.userId;
        const parsedBody= createWorkspaceSchema.parse(req.body);

        const workspace= await createWorkspace(userId,parsedBody.name);
        return res.status(201).json(workspace);
    }  catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message });
    }
    return res.status(400).json({ error: error.message });
  }
};


export const listWorkspaces= async(req:Request, res:Response) =>{
    try{
        const userId= (req as any).user.userId;
        const workspaces= await getUserWorkspaces(userId);
        return res.status(200).json(workspaces);
    } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


export const generateApiKey= async(req:Request, res:Response)=>{
    try{
        const workspaceId= req.params.workspaceId as string;
        const parsedBody= createApiKeySchema.parse(req.body);

        // TODO: Add a check here to ensure this workspace actually belongs to the logged-in user!

        const result= await createApiKey(workspaceId,parsedBody.name);
        return res.status(201).json(result);
    } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message });
    }
    return res.status(400).json({ error: error.message });
  }
}