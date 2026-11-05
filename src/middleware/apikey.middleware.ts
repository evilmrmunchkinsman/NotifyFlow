import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';

export const authenticateApiKey= async(req:Request, res:Response, next:NextFunction) =>{
    const authHeader= req.headers.authorization

    if(!authHeader || !authHeader.startsWith('Bearer nf_live_')){
    return res.status(401).json({ error: 'Unauthorized: API key missing or malformed' });
    }

    const rawKey=authHeader.split(' ')[1];

    try{
        const keyHash= crypto.createHash('sha256').update(rawKey as string).digest('hex');
    

    const apiKey= await prisma.apiKey.findUnique({
        where:{keyHash},
        include:{workspace:true}
    });
    if (!apiKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    (req as any).workspace= apiKey.workspace;

    next();
}  catch (error) {
    return res.status(500).json({ error: 'Internal server error during API key verification' });
  }
    
}