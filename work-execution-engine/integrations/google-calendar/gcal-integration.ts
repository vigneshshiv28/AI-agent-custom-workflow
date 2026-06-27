import { google, calendar_v3 } from "googleapis";
import { ConnectedIntegration } from "../base/connected-integration";
import { AgentNodeOutput, ExecutionContext } from "../../type";
import { IntegrationRepository } from "@/lib/repositories";
import { decrypt } from "@/lib/utils/crypto";
import { Node } from "@/schema/workflow";
import { createGoogleCalendarAgent } from "./gcal-agent";

export class GoogleCalendarIntegration extends ConnectedIntegration {
  readonly nodeType = "google-calendar";

  protected async connect(context: ExecutionContext): Promise<void> {
    const userId: string = context.variables.userId;

    if (!userId) {
      throw new Error("GoogleCalendarIntegration: userId is missing from ExecutionContext.variables.");
    }

    const record = await IntegrationRepository.findIntegrationByUserIdAndProvider(
      userId,
      "google-calendar"
    );

    if (!record) {
      throw new Error(
        `Google Calendar integration not connected for user ${userId}. ` +
        "Connect your Google Calendar account in the Integrations settings."
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

    this.client = google.calendar({ version: 'v3', auth: oauth2Client });
  }

  protected getClient(): calendar_v3.Calendar {
    return this.client as calendar_v3.Calendar;
  }

  protected async executeInternal(
    node: Node,
    input: AgentNodeOutput,
    context: ExecutionContext,
  ): Promise<AgentNodeOutput> {
    const calendar = this.getClient();
    const userPrompt: string = node.data?.Prompt ?? node.data?.prompt ?? "";

    const agent = createGoogleCalendarAgent(calendar);

    const result = await agent.generate({
      prompt: `
===== PREVIOUS NODE OUTPUT =====
text: ${input?.text ?? "(none)"}
data: ${JSON.stringify(input?.data ?? {}, null, 2)}

===== YOUR TASK =====
${userPrompt}
      `.trim(),

      onToolExecutionEnd({ toolCall, toolExecutionMs, toolOutput }: any) {
        const tag = toolOutput.type === "tool-result" ? "✓" : "✗";
        console.log(
          `[gcal:tool] ${tag} ${toolCall.toolName} ${toolExecutionMs}ms`,
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
          nodeType: "google-calendar",
          timestamp: Date.now(),
        });
      },

      onStepEnd({ stepNumber, performance, usage, toolCalls, finishReason }: any) {
        console.log(`[gcal:step:${stepNumber}]`, {
          llmMs: performance.stepTimeMs,
          tokensOut: usage.outputTokens,
          finishReason,
          tools: toolCalls?.map((t: any) => t.toolName)
        });

        if (usage.outputTokens > 300 && !toolCalls?.length) {
          console.warn(`[gcal] step ${stepNumber}: model generating text instead of tool call`);
        }
      },

      onEnd({ steps, usage }: any) {
        console.log(`[gcal:done] ${steps.length} steps | ${usage.totalTokens} tokens`);
        if (steps.length > 4) {
          console.warn("[gcal] high step count — review prompt");
        }
      },
    });

    return {
      text: result.text,
      data: result.toolResults?.at(-1)?.output ?? {},
    };
  }
}
