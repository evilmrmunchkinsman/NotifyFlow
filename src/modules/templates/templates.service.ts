import prisma from '../../lib/prisma';


export const createTemplate = async(workspaceId: string, data:any) =>
 {
    const newTemplate= await prisma.template.create({
        data:{
            workspaceId:workspaceId,
            name:data.name,
            channel:data.channel,
            subject:data.subject,
            body:data.body,
        },
    });
    return newTemplate;
};


export const getTemplates= async(workspaceId:string) =>{
    const templates= await prisma.template.findMany({
        where:{workspaceId:workspaceId},
        orderBy:{createdAt:'desc'},
    });

    return templates;
};


export const getTemplateById= async(id:string,workspaceId:string) =>{
    const template= await prisma.template.findFirst({
        where:{id:id, workspaceId:workspaceId},
    });
    return template;
}


export const updateTemplate= async(id:string, workspaceId:string, data:any) =>{
    const existing= await prisma.template.findFirst({
        where:{id:id, workspaceId:workspaceId}
    });

    if(!existing){
        throw new Error('template not found');
    }


    const updated= await prisma.template.update({
        where:{id:id},
        data:{
            name:data.name,
            subject:data.subject,
            body:data.body,
        version:existing.version +1,
        },
    });
    return updated;
};