import { BaseIntegration } from "./base-integration";
import { AgentNodeOutput, ConditionNodeOutput, ExecutionContext } from "../../type";
import { Node } from "@/schema/workflow";


export abstract class ConnectedIntegration extends BaseIntegration {

  protected client: unknown = null;

  private connected = false;

  protected abstract connect(context: ExecutionContext): Promise<void>;

  protected abstract getClient(): unknown;

  protected async ensureConnected(context: ExecutionContext): Promise<void> {
    if (!this.connected) {
      await this.connect(context);
      this.connected = true;
    }
  }

  protected async disconnect(): Promise<void> {
    // Reset so the singleton reconnects fresh for every new execution.
    // Without this, user B's workflow skips connect() and uses user A's client.
    this.connected = false;
    this.client = null;
  }

  async execute(
    node: Node,
    input: AgentNodeOutput,
    context: ExecutionContext
  ): Promise<AgentNodeOutput | ConditionNodeOutput> {
    try {
      await this.ensureConnected(context);
      return await this.executeInternal(node, input, context);
    } finally {
      await this.disconnect();
    }
  }

  protected abstract executeInternal(
    node: Node,
    input: AgentNodeOutput,
    context: ExecutionContext
  ): Promise<AgentNodeOutput | ConditionNodeOutput>;
}
