import prisma from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import Redis from 'ioredis';


const redis = new Redis(process.env.REDIS_URL as string);

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const isValid = await comparePassword(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');

  return generateTokens(user.id);
};

export const registerUser= async(email:string, password:string) =>{
    const existingUser= await prisma.user.findUnique({where:{email}});
    if(existingUser) throw new Error('user already exists');

    const hashedPassword= await hashPassword(password);
    const user= await prisma.user.create({
        data:{email,password:hashedPassword}
    });

    return generateTokens(user.id)
}


const generateTokens= async(userId:string) =>{
    const accessToken= generateAccessToken(userId);
    const refreshToken= generateRefreshToken(userId);

    const tokenHash= await hashPassword(refreshToken);

    await redis.set(`refresh:${userId}`, tokenHash, 'EX',604800);

    return {accessToken,refreshToken};
};


export const rotateRefreshToken= async(refreshToken:string) =>{
    try{
        const payload= verifyRefreshToken(refreshToken);
        const storedHash= await redis.get(`refresh:${payload.userId}`);

        if(!storedHash) throw new Error('session expired')

        const isValid= await comparePassword(refreshToken,storedHash);
        if(!isValid) throw new Error('token reuse detected')
            return generateTokens(payload.userId);
    }  catch (error) {
    throw new Error('Invalid refresh token');
  }
}