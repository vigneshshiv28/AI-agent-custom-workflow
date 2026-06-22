import { providers } from "@/lib/integrations/provider-map";
import { auth } from '@/lib/auth/auth';
import { NextResponse } from "next/server";

export async function GET(request: Request) {

    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const provider = providers.google;
        const { searchParams } = new URL(request.url);
        const service = searchParams.get('service');

        const url = await provider.getAuthUrl(userId, service ?? undefined);

        return NextResponse.json({ url }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}