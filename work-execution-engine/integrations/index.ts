export { BaseIntegration } from "./base/base-integration";
export { ConnectedIntegration } from "./base/connected-integration";
export { IntegrationRegistry } from "./registry";

import { IntegrationRegistry } from "./registry";
import { NotionIntegration } from "./notion/notion-integration";

IntegrationRegistry.register(new NotionIntegration());
