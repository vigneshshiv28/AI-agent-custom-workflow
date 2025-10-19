import prisma from "../db/prisma";
import { Prisma } from "@/app/generated/prisma/client";


interface CreateToolData{
    name: string;
    description: string;
    parameters: Prisma.InputJsonValue;
    returnType: Prisma.InputJsonValue;
    prompt?: string;
    metadata?: Prisma.InputJsonValue;
}

interface UpdateToolData{
    name?: string;
    description?: string;
    parameters?: Prisma.InputJsonValue;
    returnType?: Prisma.InputJsonValue;
    prompt?: string;
    metadata?: Prisma.InputJsonValue;
}

interface CreateAgentData{
    name: string,
    description: string,
    tools: {
        name: string;
        description: string;
        parameters: Prisma.InputJsonValue;
        returnType: Prisma.InputJsonValue;
        prompt?: string;
        metadata?: Prisma.InputJsonValue;
    }[],
    metadata?: Prisma.InputJsonValue;
}


export async function createTool(agentId: string, data: CreateToolData){
    return await prisma.tool.create({
        data:{
            name: data.name,
            description: data.description,
            parameters: data.parameters,
            returnType: data.returnType,
            prompt: data.prompt,
            metadata: data.metadata,
            agentId: agentId,
        },
        include:{
            agent:{
                select:{
                    id: true,
                    name: true,
                }
            }
        }
    })
}

export async function updateTool(toolId: string, data: UpdateToolData){
    return await prisma.tool.update({
        where:{id: toolId},
        data:{
            ...(data.name && { name: data.name }),
            ...(data.description && { description: data.description }),
            ...(data.parameters && { parameters: data.parameters }),
            ...(data.returnType && { returnType: data.returnType }),
            ...(data.prompt && { prompt: data.prompt }),
            ...(data.metadata && { metadata: data.metadata }),
        },
        include:{
            agent:{
                select:{
                    id: true,
                    name: true,
                }
            }
        }
    })
}

export async function deleteTool(toolId: string){
    return await prisma.tool.delete({
        where:{id: toolId},
    })
}

export async function findToolById(toolId: string){
    return await prisma.tool.findUnique({
        where:{id: toolId},
        include:{
            agent:{
                select:{
                    id: true,
                    name: true,
                }
            }
        }
    })
}

export async function findToolByName(name: string){
    return await prisma.tool.findUnique({
        where:{name},
        include:{
            agent:{
                select:{
                    id: true,
                    name: true,
                }
            }
        }
    })
}

export async function findToolsByAgentId(agentId: string){
    return await prisma.tool.findMany({
        where:{agentId},
        orderBy:{name: "asc"},
        include:{
            agent:{
                select:{
                    id: true,
                    name: true,
                }
            }
        }
    })
}




//Agent

export async function createAgent(data: CreateAgentData){
    return await prisma.agent.create({
        data:{
            name: data.name,
            description: data.description,
            metadata: data.metadata,
            ...(data.tools && data.tools.length > 0 && {
                tools: {
                    create: data.tools
                }
            })
        },
        include:{
            tools: true
        }
    })
}





export async function deleteAgent(agentId: string){

    return await prisma.agent.delete({
        where:{id: agentId},
    })
}

export async function findAgentById(agentId: string){
    return await prisma.agent.findUnique({
        where:{id: agentId},
        include:{
            tools: true
        }
    })
}

export async function findAgentByName(name: string){
    return await prisma.agent.findFirst({
        where:{name},
        include:{
            tools: true
        }
    })
}

export async function findAllAgents(){
    return await prisma.agent.findMany({
        orderBy:{createdAt: "desc"},
        include:{
            tools: true
        }
    })
}

export async function addToolsToAgent(agentId: string, tools: CreateToolData[]){
    return await prisma.agent.update({
        where:{id: agentId},
        data:{
            tools: {
                create: tools
            }
        },
        include:{
            tools: true
        }
    })
}

export async function removeToolsFromAgent(agentId: string, toolIds: string[]){
    return await prisma.agent.update({
        where:{id: agentId},
        data:{
            tools: {
                deleteMany: {
                    id: {
                        in: toolIds
                    }
                }
            }
        },
        include:{
            tools: true
        }
    })
}
