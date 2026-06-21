import { google, Auth } from "googleapis";
import { IntegrationProvider } from "./integration-provider";
import { IntegrationCredentials, AccountInfo } from "../types";
import { encrypt } from "@/lib/crypto";


const SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

function buildClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_INTEGRATIONS_CLIENT_ID,
        process.env.GOOGLE_INTEGRATIONS_CLIENT_SECRET,
        process.env.GOOGLE_INTEGRATIONS_CALLBACK_URL,
    )
}

export class GoogleProvider
    implements IntegrationProvider {

    readonly provider = "google";


    async getAuthUrl(userId: string): Promise<string> {
        const client = buildClient();

        const state = encrypt(JSON.stringify({ userId, ts: Date.now() }));
        return client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: SCOPES,
            state,
        })
    }

    async exchangeCode(code: string): Promise<IntegrationCredentials> {
        const client = buildClient();
        const { tokens } = await client.getToken(code);

        if (!tokens.access_token) {
            throw new Error("Google did not return an access token");
        }

        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? undefined,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
            scope: tokens.scope?.split(" "),
        };
    }

    async refreshCredentials(credentials: IntegrationCredentials): Promise<IntegrationCredentials> {
        if (!credentials.refreshToken) {
            throw new Error("No refresh token available user must reconnect");
        }

        const client = buildClient();
        client.setCredentials({ refresh_token: credentials.refreshToken });

        const { credentials: refreshed } = await client.refreshAccessToken();

        return {
            accessToken: refreshed.access_token!,

            refreshToken: refreshed.refresh_token ?? credentials.refreshToken,
            expiresAt: refreshed.expiry_date
                ? new Date(refreshed.expiry_date)
                : undefined,
            scope: refreshed.scope?.split(" ") ?? credentials.scope,
        };
    }

    async getAccountInfo(credentials: IntegrationCredentials): Promise<AccountInfo> {
        const client = buildClient();
        client.setCredentials({ access_token: credentials.accessToken });

        const oauth2 = google.oauth2({ auth: client, version: "v2" });
        const { data } = await oauth2.userinfo.get();

        if (!data.id) {
            throw new Error("Google did not return a user id");
        }

        return {
            accountId: data.id,
            email: data.email ?? undefined,
            name: data.name ?? undefined,
        };
    }

    async revoke(credentials: IntegrationCredentials): Promise<void> {
        const client = buildClient();
        await client.revokeToken(credentials.accessToken);
    }
}