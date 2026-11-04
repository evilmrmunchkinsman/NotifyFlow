import { Request, Response } from 'express';
import { registerUser, loginUser, rotateRefreshToken } from './auth.services';
import { z } from 'zod';

const registerSchema= z.object({
    email: z.string().email(),
    password: z.string().min(8),
}) ;


const loginSchema= z.object({
    email: z.string().email(),
    password: z.string(),
});


export const register= async(req:Request, res: Response) =>{
    try{
        const parsedBody= registerSchema.parse(req.body);
        const tokens= await registerUser(parsedBody.email, parsedBody.password);
        return res.status(201).json(tokens);
    } catch(error:any){
        if(error instanceof z.ZodError){
            return res.status(400).json({error:error.issues[0]?.message});
        } 
        return res.status(400).json({error:error.message});
    }
};


export const login= async(req:Request, res:Response) =>{
    try{
        const parsedBody= loginSchema.parse(req.body);
        const tokens= await loginUser(parsedBody.email, parsedBody.password);
        return res.status(200).json(tokens);
    } catch(error:any){
        if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message });
    }
    return res.status(401).json({ error: error.message });
    }
}


export const refresh= async(req:Request, res:Response)=>{
    try{
        const{refreshToken} = req.body;
        if(!refreshToken){
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const tokens= await rotateRefreshToken(refreshToken);
        return res.status(200).json(tokens);
    } catch(error:any){
        return res.status(401).json({ error: error.message });
    }
}