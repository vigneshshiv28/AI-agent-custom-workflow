import { google } from "googleapis";
import { ConnectedIntegration } from "../base/connected-integration";
import { AgentNodeOutput, ExecutionContext } from "../../type";
import { IntegrationRepository } from "@/lib/repositories";
import { decrypt } from "@/lib/utils/crypto";
import { Node } from "@/schema/workflow";
import { createGoogleDriveAgent } from "./gdrive-agent";

export class GoogleDriveIntegration extends ConnectedIntegration {
  readonly nodeType = "google-drive";

  protected async connect(context: ExecutionContext): Promise<void> {
    const userId: string = context.variables.userId;

    if (!userId) {
      throw new Error("GoogleDriveIntegration: userId is missing from ExecutionContext.variables.");
    }

    const record = await IntegrationRepository.findIntegrationByUserIdAndProvider(
      userId,
      "google-drive"
    );

    if (!record) {
      throw new Error(
        `Google Drive integration not connected for user ${userId}. ` +
        "Connect your Google Drive account in the Integrations settings."
      );
    }

    const credentials = record.credentials as any;
    const accessToken = decrypt(credentials.accessToken);
    const refreshToken = credentials.refreshToken ? decrypt(credentials.refreshToken) : undefined;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_INTEGRATIONS_CLIENT_ID,
      process.env.GOOGLE_INTEGRATIONS_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.client = google.drive({ version: 'v3', auth: oauth2Client });
  }

  protected getClient(): any {
    return this.client;
  }

  protected async executeInternal(
    node: Node,
    input: AgentNodeOutput,
    context: ExecutionContext,
  ): Promise<AgentNodeOutput> {
    const drive = this.getClient();
    const userPrompt = node.data?.Prompt ?? node.data?.prompt ?? "";

    const snapshot = await this.fetchWorkspaceSnapshot(drive);

    const agent = createGoogleDriveAgent(drive);

    const result = await agent.generate({
      prompt: `
===== WORKSPACE_SNAPSHOT =====
${snapshot}

===== PREVIOUS NODE OUTPUT =====
text: ${input?.text ?? "(none)"}
data: ${JSON.stringify(input?.data ?? {}, null, 2)}

===== YOUR TASK =====
${userPrompt}
      `.trim(),

      onToolExecutionStart({ toolCall }: any) {
        console.log(`[gdrive:tool] start ${toolCall.toolName}`, { input: toolCall.input });
        context.emit({
          type: "agent:tool:start",
          toolName: toolCall.toolName,
          toolInput: toolCall.input,
          executionId: context.executionId,
          userId: context.variables.userId,
          workflowId: context.variables.workflowId,
          nodeId: node.id,
          nodeType: "google-drive",
          timestamp: Date.now(),
        });
      },

      onToolExecutionEnd({ toolCall, toolExecutionMs, toolOutput }: any) {
        const tag = toolOutput.type === "tool-result" ? "✓" : "✗";
        console.log(
          `[gdrive:tool] ${tag} ${toolCall.toolName} ${toolExecutionMs}ms`,
          { input: toolCall.input }
        );
        context.emit({
          type: "agent:tool:result",
          toolName: toolCall.toolName,
          toolOutput: toolOutput.type === "tool-result"
            ? toolOutput.output
            : { error: String(toolOutput.error) },
          executionId: context.executionId,
          userId: context.variables.userId,
          workflowId: context.variables.workflowId,
          nodeId: node.id,
          nodeType: "google-drive",
          timestamp: Date.now(),
        });
      },

      onStepEnd({ stepNumber, performance, usage, toolCalls, finishReason }: any) {
        console.log(`[gdrive:step:${stepNumber}]`, {
          llmMs: performance.stepTimeMs,
          tokensOut: usage.outputTokens,
          finishReason,
          tools: toolCalls?.map((t: any) => t.toolName)
        });

        if (usage.outputTokens > 300 && !toolCalls?.length) {
          console.warn(`[gdrive] step ${stepNumber}: model generating text instead of tool call`);
        }
      },

      onEnd({ steps, usage }: any) {
        console.log(`[gdrive:done] ${steps.length} steps | ${usage.totalTokens} tokens`);
        if (steps.length > 4) {
          console.warn("[gdrive] high step count — review prompt");
        }
      },
    });

    return {
      text: result.text,
      data: result.toolResults?.at(-1)?.output ?? {},
    };
  }

  private async fetchWorkspaceSnapshot(drive: any): Promise<string> {
    try {

      const response = await drive.files.list({
        pageSize: 30,
        fields: 'files(id, name, mimeType, parents)',
        orderBy: 'modifiedTime desc',
      });

      const items = response.data.files?.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
        mimeType: item.mimeType,
        parents: item.parents,
      })) || [];

      return JSON.stringify(items, null, 2);
    } catch (error) {
      console.warn("Failed to fetch Google Drive workspace snapshot:", error);
      return "[]";
    }
  }
}
