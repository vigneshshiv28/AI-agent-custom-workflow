import { workflowBus } from "@/lib/events/workflow-bus";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
) {

    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            const sentEvent = (event: string, data: unknown) => {
                controller.enqueue(
                    encoder.encode(
                        `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                    )
                )
            };

            sentEvent("connected", { userId });

            workflowBus.subscribe(`workflow-events:${session.user.id}`);

            workflowBus.on(`workflow-events:${session.user.id}`, (data) => sentEvent(userId, data));

            const heartbeat = setInterval(() => {
                controller.enqueue(
                    encoder.encode(`: heartbeat\n\n`)
                )

            }, 15000)


            const cleanUp = () => {
                clearInterval(heartbeat);
                workflowBus.off(`workflow-events:${session.user.id}`);

                try {
                    controller.close()
                } catch {

                }
            }

            request.signal.addEventListener(`abort`, cleanUp);

        }


    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Content-Encoding': 'none',
        },
    })
}