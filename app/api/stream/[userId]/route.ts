import { workflowBus } from "@/lib/events/workflow-bus";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import type { SSEEvent } from "@/lib/events/sse-events";


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
    const channel = `workflow-events:${userId}`;

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (eventType: string, data: unknown) => {
                controller.enqueue(
                    encoder.encode(
                        `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
                    )
                );
            };


            sendEvent('connected', { type: 'connected', userId } satisfies SSEEvent);

            try {
                await workflowBus.subscribe(channel);
                console.log(`subscribe to channel${channel}`)
            } catch (err) {
                console.error(`failed to subscribe to channel ${channel}`, err);
            }


            const handler = (data: unknown) => {
                console.log("recieved event");
                const event = data as SSEEvent;

                sendEvent(event.type ?? 'message', event);
            };

            workflowBus.on(channel, handler);


            const heartbeat = setInterval(() => {
                controller.enqueue(encoder.encode(': heartbeat\n\n'));
            }, 15_000);

            const cleanUp = () => {
                console.log("Cleaning up connections");
                clearInterval(heartbeat);
                workflowBus.off(channel, handler);
                try { controller.close(); } catch { }
            };

            request.signal.addEventListener('abort', cleanUp);
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Content-Encoding': 'none',
        },
    });
}