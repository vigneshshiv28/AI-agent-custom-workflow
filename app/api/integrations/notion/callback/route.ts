import { NextResponse } from "next/server";
import { providers } from "@/lib/integrations/provider-map";
import { IntegrationService } from "@/lib/services";
import { decrypt } from "@/lib/utils/crypto";
import { auth } from "@/lib/auth/auth";

const DASHBOARD_URL = `${process.env.CLIENT_BASE_URL}/dashboard/connections`;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
        return NextResponse.redirect(
            `${DASHBOARD_URL}?error=${encodeURIComponent(errorParam)}`
        );
    }

    if (!code || !stateParam) {
        return NextResponse.redirect(`${DASHBOARD_URL}?error=missing_params`);
    }

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return NextResponse.redirect(`${DASHBOARD_URL}?error=unauthenticated`);
    }

    let userId: string;
    try {
        const decrypted = decrypt(stateParam);
        const parsed = JSON.parse(decrypted) as { userId: string; ts: number };

        if (Date.now() - parsed.ts > 10 * 60 * 1000) {
            return NextResponse.redirect(`${DASHBOARD_URL}?error=state_expired`);
        }

        if (parsed.userId !== session.user.id) {
            return NextResponse.redirect(`${DASHBOARD_URL}?error=user_mismatch`);
        }

        userId = parsed.userId;
    } catch {
        return NextResponse.redirect(`${DASHBOARD_URL}?error=invalid_state`);
    }

    const provider = providers.notion;

    let credentials;
    let accountInfo;
    try {
        credentials = await provider.exchangeCode(code);
        accountInfo = await provider.getAccountInfo(credentials);
    } catch (error) {
        console.error("[notion/callback] Token exchange failed:", error);
        return NextResponse.redirect(`${DASHBOARD_URL}?error=token_exchange_failed`);
    }

    try {
        await IntegrationService.connectIntegration(userId, "notion", credentials, accountInfo);
    } catch (error) {
        console.error("[notion/callback] Failed to save integration:", error);
        return NextResponse.redirect(`${DASHBOARD_URL}?error=save_failed`);
    }

    return NextResponse.redirect(`${DASHBOARD_URL}?connected=notion`);
}
