import { google, gmail_v1 } from "googleapis";
import { ConnectedIntegration } from "../base/connected-integration";
import { AgentNodeOutput, ExecutionContext } from "../../type";
import { IntegrationRepository } from "@/lib/repositories";
import { decrypt } from "@/lib/utils/crypto";
import { Node } from "@/schema/workflow";
import { createGmailAgent } from "./gmail-agent";

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

    const agent = createGmailAgent(gmail);

    const result = await agent.generate({
      prompt: `
===== PREVIOUS NODE OUTPUT =====
text: ${input?.text ?? "(none)"}
data: ${JSON.stringify(input?.data ?? {}, null, 2)}

===== YOUR TASK =====
${userPrompt}
      `.trim(),

      onToolExecutionStart({ toolCall }: any) {
        console.log(`[gmail:tool] start ${toolCall.toolName}`, { input: toolCall.input });
        context.emit({
          type: "agent:tool:start",
          toolName: toolCall.toolName,
          toolInput: toolCall.input,
          executionId: context.executionId,
          userId: context.variables.userId,
          workflowId: context.variables.workflowId,
          nodeId: node.id,
          nodeType: "gmail",
          timestamp: Date.now(),
        });
      },

      onToolExecutionEnd({ toolCall, toolExecutionMs, toolOutput }: any) {
        const tag = toolOutput.type === "tool-result" ? "✓" : "✗";
        console.log(
          `[gmail:tool] ${tag} ${toolCall.toolName} ${toolExecutionMs}ms`,
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
          nodeType: "gmail",
          timestamp: Date.now(),
        });
      },

      onStepEnd({ stepNumber, performance, usage, toolCalls, finishReason }: any) {
        console.log(`[gmail:step:${stepNumber}]`, {
          llmMs: performance.stepTimeMs,
          tokensOut: usage.outputTokens,
          finishReason,
          tools: toolCalls?.map((t: any) => t.toolName)
        });

        if (usage.outputTokens > 300 && !toolCalls?.length) {
          console.warn(`[gmail] step ${stepNumber}: model generating text instead of tool call`);
        }
      },

      onEnd({ steps, usage }: any) {
        console.log(`[gmail:done] ${steps.length} steps | ${usage.totalTokens} tokens`);
        if (steps.length > 4) {
          console.warn("[gmail] high step count — review prompt");
        }
      },
    });

    return {
      text: result.text,
      data: result.toolResults?.at(-1)?.output ?? {},
    };
  }
}
