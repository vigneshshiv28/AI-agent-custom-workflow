import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { IntegrationService } from '@/lib/services';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ provider: string }> }
) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { provider } = await params;
        await IntegrationService.disconnectIntegration(session.user.id, provider);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
