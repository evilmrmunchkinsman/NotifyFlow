import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';


export const authenticate= (req:Request, res:Response,next:NextFunction) =>{
    const authHeader= req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer')){
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token= authHeader.split(' ')[1];

    try{
        const payload= verifyAccessToken(token as string);

        (req as any).user= payload;

        next();

    }
    catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}