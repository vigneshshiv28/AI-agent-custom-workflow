import { google, gmail_v1 } from "googleapis";
import { ConnectedIntegration } from "../base/connected-integration";
import { AgentNodeOutput, ExecutionContext } from "../../type";
import { IntegrationRepository } from "@/lib/repositories";
import { decrypt } from "@/lib/utils/crypto";
import { Node } from "@/schema/workflow";
import { runGmailAgent } from "./gmail-agent";


export class GmailIntegration extends ConnectedIntegration {
  readonly nodeType = "gmail";

  protected async connect(context: ExecutionContext): Promise<void> {
    const userId: string = context.variables.userId;

    if (!userId) {
      throw new Error("GmailIntegration: userId is missing from ExecutionContext.variables.");
    }

    const record = await IntegrationRepository.findIntegrationByUserIdAndProvider(
      userId,
      "gmail"
    );

    if (!record) {
      throw new Error(
        `Gmail integration not connected for user ${userId}. ` +
        "Connect your Gmail account in the Integrations settings."
      );
    }

    const credentials = record.credentials as Record<string, string>;
    const accessToken = decrypt(credentials.accessToken);
    const refreshToken = credentials.refreshToken ? decrypt(credentials.refreshToken) : undefined;

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_INTEGRATIONS_CLIENT_ID,
        process.env.GOOGLE_INTEGRATIONS_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
    });

    this.client = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  protected getClient(): gmail_v1.Gmail {
    return this.client as gmail_v1.Gmail;
  }

  protected async executeInternal(
    node: Node,
    input: AgentNodeOutput,
    context: ExecutionContext,
  ): Promise<AgentNodeOutput> {
    const gmail = this.getClient();
    const userPrompt: string = node.data?.Prompt ?? node.data?.prompt ?? "";

    return runGmailAgent(gmail, userPrompt, input, async (toolName, phase, data) => {
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
