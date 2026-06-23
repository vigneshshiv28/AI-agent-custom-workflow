import { IntegrationProvider } from "@/lib/integrations/providers/integration-provider";
import { IntegrationCredentials, AccountInfo } from "../types";
import { encrypt } from "@/lib/utils/crypto";


const NOTION_API_VERSION = "2022-06-28";

const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";

const NOTION_USERS_ME_URL = "https://api.notion.com/v1/users/me";


export class NotionProvider implements IntegrationProvider {
    readonly provider = "notion";


    async getAuthUrl(userId: string): Promise<string> {
        if (!process.env.NOTION_AUTHORIZATION_URL) {
            throw new Error(
                "NOTION_AUTHORIZATION_URL is not set in environment variables."
            );
        }

        const url = new URL(process.env.NOTION_AUTHORIZATION_URL);
        const state = encrypt(JSON.stringify({ userId, ts: Date.now() }));

        url.searchParams.set("state", state);

        return url.toString();
    }


    async exchangeCode(code: string): Promise<IntegrationCredentials> {
        if (
            !process.env.NOTION_INTEGRATIONS_CLIENT_ID ||
            !process.env.NOTION_INTEGRATIONS_CLIENT_SECRET
        ) {
            throw new Error(
                "NOTION_INTEGRATIONS_CLIENT_ID or NOTION_INTEGRATIONS_CLIENT_SECRET is not set."
            );
        }

        const basicAuth = Buffer.from(
            `${process.env.NOTION_INTEGRATIONS_CLIENT_ID}:${process.env.NOTION_INTEGRATIONS_CLIENT_SECRET}`
        ).toString("base64");

        const response = await fetch(NOTION_TOKEN_URL, {
            method: "POST",
            headers: {
                Authorization: `Basic ${basicAuth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.NOTION_INTEGRATIONS_CALLBACK_URL,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Notion error bodies include `error` and `error_description`
            throw new Error(
                `Notion token exchange failed (${response.status}): ` +
                `${data?.error ?? "unknown_error"} — ${data?.error_description ?? "no description"}`
            );
        }

        if (!data.access_token) {
            throw new Error("Notion did not return an access_token.");
        }

        // Notion tokens are permanent — no expiry, no refresh token.
        return {
            accessToken: data.access_token,

            refreshToken: undefined,
            // Notion tokens do not expire.
            expiresAt: undefined,
            // Notion does not return a scope string in the token response;
            // workspace access is determined by what the user consents to
            // inside the Notion permissions dialog.
            scope: undefined,
        };
    }


    async refreshCredentials(
        _credentials: IntegrationCredentials
    ): Promise<IntegrationCredentials> {
        //Notion didn't support refresh tokens
        throw new Error(
            "Notion does not support token refresh. " +
            "Notion access tokens are permanent and non-expiring. " +
            "If the token is invalid, ask the user to reconnect their Notion account."
        );
    }


    async getAccountInfo(
        credentials: IntegrationCredentials
    ): Promise<AccountInfo> {
        const response = await fetch(NOTION_USERS_ME_URL, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${credentials.accessToken}`,
                "Notion-Version": NOTION_API_VERSION,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                `Notion getAccountInfo failed (${response.status}): ` +
                `${data?.code ?? "unknown_error"} — ${data?.message ?? "no message"}`
            );
        }

        const botId: string = data.id;
        const ownerUser = data.bot?.owner?.user;

        const name: string | undefined =
            ownerUser?.name ?? data.name ?? undefined;

        const email: string | undefined =
            ownerUser?.person?.email ?? undefined;

        if (!botId) {
            throw new Error(
                "Notion did not return an integration bot ID in /v1/users/me."
            );
        }

        return {
            accountId: botId,
            email,
            name,
        };
    }


    async revoke(credentials: IntegrationCredentials): Promise<void> {
        if (
            !process.env.NOTION_INTEGRATIONS_CLIENT_ID ||
            !process.env.NOTION_INTEGRATIONS_CLIENT_SECRET
        ) {
            throw new Error(
                "NOTION_INTEGRATIONS_CLIENT_ID or NOTION_INTEGRATIONS_CLIENT_SECRET is not set."
            );
        }

        const basicAuth = Buffer.from(
            `${process.env.NOTION_INTEGRATIONS_CLIENT_ID}:${process.env.NOTION_INTEGRATIONS_CLIENT_SECRET}`
        ).toString("base64");

        const response = await fetch("https://api.notion.com/v1/oauth/revoke", {
            method: "POST",
            headers: {
                Authorization: `Basic ${basicAuth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token: credentials.accessToken,
            }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(
                `Notion token revocation failed (${response.status}): ` +
                `${data?.error ?? "unknown_error"} — ${data?.message ?? "no message"}`
            );
        }
    }
}