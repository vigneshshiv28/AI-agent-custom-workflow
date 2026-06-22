export interface IntegrationResponse {
  provider: string;
  oauthProvider: string;
  name: string;
  description: string;
  icon: string;
  authType: 'OAuth';
  accountEmail?: string | null;
  status: 'CONNECTED' | 'NOT_CONNECTED';
  connectedAt?: Date | string | null;
}
