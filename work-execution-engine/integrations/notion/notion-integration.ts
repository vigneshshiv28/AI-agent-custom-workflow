import { Client } from "@notionhq/client";
import { ConnectedIntegration } from "../base/connected-integration";
import { AgentNodeOutput, ExecutionContext } from "../../type";
import { IntegrationRepository } from "@/lib/repositories";
import { decrypt } from "@/lib/utils/crypto";
import { Node } from "@/schema/workflow";
import { runNotionAgent } from "./notion-agent";


export class NotionIntegration extends ConnectedIntegration {
  readonly nodeType = "notion";

  protected async connect(context: ExecutionContext): Promise<void> {
    const userId: string = context.variables.userId;

    if (!userId) {
      throw new Error("NotionIntegration: userId is missing from ExecutionContext.variables.");
    }

    const record = await IntegrationRepository.findIntegrationByUserIdAndProvider(
      userId,
      "notion"
    );

    if (!record) {
      throw new Error(
        `Notion integration not connected for user ${userId}. ` +
        "Connect your Notion account in the Integrations settings."
      );
    }

    const credentials = record.credentials as Record<string, string>;
    const accessToken = decrypt(credentials.accessToken);

    this.client = new Client({ auth: accessToken });
  }

  protected getClient(): Client {
    return this.client as Client;
  }

  protected async executeInternal(
    node: Node,
    input: AgentNodeOutput,
    context: ExecutionContext,
  ): Promise<AgentNodeOutput> {
    const notion = this.getClient();
    const userPrompt: string = node.data?.Prompt ?? node.data?.prompt ?? "";

    return runNotionAgent(notion, userPrompt, input, async (toolName, phase, data) => {
      if (phase === "start") {
        await context.emit({
          type: "agent:tool:start",
          executionId: context.executionId,
          userId: context.variables.userId,
          workflowId: context.variables.workflowId,
          nodeId: node.id,
          nodeType: this.nodeType,
          toolName,
          toolInput: data as Record<string, any>,
          timestamp: Date.now(),
        });
      } else {
        await context.emit({
          type: "agent:tool:result",
          executionId: context.executionId,
          userId: context.variables.userId,
          workflowId: context.variables.workflowId,
          nodeId: node.id,
          nodeType: this.nodeType,
          toolName,
          toolOutput: data,
          timestamp: Date.now(),
        });
      }
    });
  }
}
