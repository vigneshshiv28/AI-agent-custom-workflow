import { IntegrationCredentials, AccountInfo } from "@/lib/integrations/types";


export interface IntegrationProvider {
    readonly provider: string;

    getAuthUrl(userId: string, service?: string): Promise<string>;

    exchangeCode(code: string): Promise<IntegrationCredentials>;

    refreshCredentials(
        credentials: IntegrationCredentials
    ): Promise<IntegrationCredentials>;

    getAccountInfo(
        credentials: IntegrationCredentials
    ): Promise<AccountInfo>;

    revoke(
        credentials: IntegrationCredentials
    ): Promise<void>;
}