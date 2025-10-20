import {auth} from "@/lib/auth/auth"
import {NextResponse} from "next/server"
import { WorkflowService } from "@/lib/services"
import { z } from "zod"

const createWorkflowSchema = z.object({
    name: z.string().min(1),
    workflow: z.any(),
})

export async function POST(request: Request){
    const session = await auth.api.getSession({headers: request.headers})

    if (!session){
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    try {

        const body = await request.json()
        const result = createWorkflowSchema.safeParse(body)

        if (!result.success){
            return NextResponse.json({error: result.error.message}, {status: 400})
        }

        const workflow = await WorkflowService.createWorkflow(session.user.id, result.data)

        return NextResponse.json(workflow, {status: 201})

    } catch (error) {
        return NextResponse.json(
            {error: error instanceof Error ? error.message : "Internal Server Error"}, 
            {status: 500}
        )
    }

}

export async function GET(request: Request){
    const session = await auth.api.getSession({headers: request.headers})

    if (!session){
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    try {
        const workflows = await WorkflowService.getWorkflowsByUserId(session.user.id)
        return NextResponse.json(workflows,{status: 200})
    } catch (error) {
        return NextResponse.json(
            {error: error instanceof Error ? error.message : "Internal Server Error"}, 
            {status: 500}
        )
    }
}