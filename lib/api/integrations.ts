import { apiFetch } from './client';
import { IntegrationResponse } from '@/shared/contracts/integration.contract';

export async function getIntegrations(): Promise<IntegrationResponse[]> {
  return await apiFetch<IntegrationResponse[]>('/api/integrations');
}

export async function connectIntegration(provider: string, service?: string): Promise<{ url: string }> {
  const url = service ? `/api/integrations/${provider}/connect?service=${service}` : `/api/integrations/${provider}/connect`;
  return await apiFetch<{ url: string }>(url);
}

export async function disconnectIntegration(provider: string): Promise<void> {
  return await apiFetch<void>(`/api/integrations/${provider}`, {
    method: 'DELETE',
  });
}
