import prisma from '../../lib/prisma';
import { generateRawApiKey, hashApiKey } from '../../utils/crypto';


export const createWorkspace= async(userId:string, name:string) =>{
    return prisma.workspace.create({
        data:{
            name,
            userId,
        },
    });
};

export const getUserWorkspaces= async(userId:string) =>{
    return prisma.workspace.findMany({
        where:{userId},
        orderBy:{createdAt:'desc'},
    });
};

export const createApiKey= async(workspaceId:string, name:string) =>{
    const rawKey= generateRawApiKey();
    const keyHash= hashApiKey(rawKey);
    const prefix= rawKey.substring(0,12);

    await prisma.apiKey.create({
        data:{
            workspaceId,
            name,
            keyHash,
            prefix,
        }
    });

    return {rawKey,prefix};
};