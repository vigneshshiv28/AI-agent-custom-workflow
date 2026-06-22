import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import { IntegrationService } from '@/lib/services';

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const integrations = await IntegrationService.getIntegrations(session.user.id);
    return NextResponse.json(integrations, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
