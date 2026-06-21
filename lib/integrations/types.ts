export interface IntegrationCredentials {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string[];

}

export interface AccountInfo {
    accountId: string;
    email?: string;
    name?: string;
}