export { BaseIntegration } from "./base/base-integration";
export { ConnectedIntegration } from "./base/connected-integration";
export { IntegrationRegistry } from "./registry";

import { IntegrationRegistry } from "./registry";
import { NotionIntegration } from "./notion/notion-integration";
import { GmailIntegration } from "./gmail/gmail-integration";
import { GoogleCalendarIntegration } from "./google-calendar/gcal-integration";

IntegrationRegistry.register(new NotionIntegration());
IntegrationRegistry.register(new GmailIntegration());
IntegrationRegistry.register(new GoogleCalendarIntegration());
