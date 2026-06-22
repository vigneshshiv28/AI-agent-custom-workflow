import { IntegrationRepository, UserRepository } from '../repositories';
import { IntegrationResponse } from '@/shared/contracts/integration.contract';
import { IntegrationCredentials, AccountInfo } from '@/lib/integrations/types';
import { encrypt } from '@/lib/utils/crypto';
import { Prisma } from '@/app/generated/prisma/client';

interface ProviderConfig {
  oauthProvider: string;
  name: string;
  description: string;
  icon: string;
  authType: 'OAuth';
}

const PROVIDER_REGISTRY: Record<string, ProviderConfig> = {
  'gmail': {
    oauthProvider: 'google',
    name: 'Gmail',
    description: 'Send and read emails from Gmail accounts used in your workflows.',
    icon: 'gmail',
    authType: 'OAuth',
  },
  'google-calendar': {
    oauthProvider: 'google',
    name: 'Google Calendar',
    description: 'Create, read, and manage calendar events in Google Calendar.',
    icon: 'google-calendar',
    authType: 'OAuth',
  },
  'google-drive': {
    oauthProvider: 'google',
    name: 'Google Drive',
    description: 'Read, upload, and manage files in Google Drive.',
    icon: 'google-drive',
    authType: 'OAuth',
  },
};

async function getIntegrations(userId: string): Promise<IntegrationResponse[]> {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const userIntegrations = await IntegrationRepository.findIntegrationsByUserId(userId);

  return Object.entries(PROVIDER_REGISTRY).map(([providerKey, config]) => {

    const connectedIntegration = userIntegrations.find(
      (i) => i.provider === providerKey && i.status === 'CONNECTED'
    );

    const credentials = connectedIntegration?.credentials as Record<string, unknown> | undefined;
    const accountEmail = typeof credentials?.accountEmail === 'string' ? credentials.accountEmail : null;

    return {
      provider: providerKey,
      oauthProvider: config.oauthProvider,
      name: config.name,
      description: config.description,
      icon: config.icon,
      authType: config.authType,
      accountEmail,
      status: connectedIntegration ? 'CONNECTED' : 'NOT_CONNECTED',
      connectedAt: connectedIntegration ? connectedIntegration.updatedAt : null,
    };
  });
}

async function connectIntegration(
  userId: string,
  provider: string,
  credentials: IntegrationCredentials,
  accountInfo: AccountInfo,
): Promise<void> {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const json: Prisma.InputJsonObject = {
    accessToken: encrypt(credentials.accessToken),
    refreshToken: credentials.refreshToken ? encrypt(credentials.refreshToken) : null,
    expiresAt: credentials.expiresAt?.toISOString() ?? null,
    scope: credentials.scope ?? [],
    accountId: accountInfo.accountId,
    accountEmail: accountInfo.email ?? null,
    accountName: accountInfo.name ?? null,
  };

  const existing = await IntegrationRepository.findIntegrationByUserIdAndProvider(userId, provider);

  if (existing) {
    await IntegrationRepository.updateIntegration(existing.id, { credentials: json });
  } else {
    await IntegrationRepository.createIntegration({ userId, provider, credentials: json });
  }
}

async function disconnectIntegration(userId: string, provider: string): Promise<void> {
  const existing = await IntegrationRepository.findIntegrationByUserIdAndProvider(userId, provider);
  if (existing) {
    // Optionally call provider.revoke() if needed, but deleting from our DB is the minimum requirement
    await IntegrationRepository.deleteIntegration(existing.id);
  }
}

export const IntegrationService = {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
};
