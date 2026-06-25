import { BaseIntegration } from "./base/base-integration";


export class IntegrationRegistry {
  private static readonly map = new Map<string, BaseIntegration>();

  static register(integration: BaseIntegration): void {
    if (this.map.has(integration.nodeType)) {
      throw new Error(
        `IntegrationRegistry: "${integration.nodeType}" is already registered. ` +
        `Each nodeType must be registered exactly once.`
      );
    }
    this.map.set(integration.nodeType, integration);
  }

  static get(nodeType: string): BaseIntegration | undefined {
    return this.map.get(nodeType);
  }

  static registeredTypes(): string[] {
    return Array.from(this.map.keys());
  }
}
