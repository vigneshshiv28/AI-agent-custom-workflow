import { Client } from "@notionhq/client";
import { ConnectedIntegration } from "../base/connected-integration";
import { AgentNodeOutput, ExecutionContext } from "../../type";
import { IntegrationRepository } from "@/lib/repositories";
import { decrypt } from "@/lib/utils/crypto";
import { Node } from "@/schema/workflow";
import { createNotionAgent } from "./notion-agent";

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
    const userPrompt = node.data?.Prompt ?? node.data?.prompt ?? "";

    const snapshot = await this.fetchWorkspaceSnapshot(notion);

    const agent = createNotionAgent(notion);

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
        console.log(`[notion:tool:start] ${toolCall.toolName}`, { input: toolCall.input });
        context.emit({
          type: "agent:tool:start",
          toolName: toolCall.toolName,
          toolInput: toolCall.input,
          executionId: context.executionId,
          userId: context.variables.userId,
          workflowId: context.variables.workflowId,
          nodeId: node.id,
          nodeType: "notion",
          timestamp: Date.now(),
        });
      },

      onToolExecutionEnd({ toolCall, toolExecutionMs, toolOutput }: any) {
        const tag = toolOutput.type === "tool-result" ? "✓" : "✗";
        console.log(
          `[notion:tool] ${tag} ${toolCall.toolName} ${toolExecutionMs}ms`,
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
          nodeType: "notion",
          timestamp: Date.now(),
        });
      },

      onStepEnd({ stepNumber, performance, usage, toolCalls, finishReason }: any) {
        console.log(`[notion:step:${stepNumber}]`, {
          llmMs: performance.stepTimeMs,
          tokensOut: usage.outputTokens,
          finishReason,
          tools: toolCalls?.map((t: any) => t.toolName)
        });

        if (usage.outputTokens > 300 && !toolCalls?.length) {
          console.warn(`[notion] step ${stepNumber}: model generating text instead of tool call`);
        }
        if (toolCalls?.some((t: any) => t.toolName === "search")) {
          const query = (toolCalls.find((t: any) => t.toolName === "search")?.input as any)?.query;
          if (query && query !== "") {
            console.warn(`[notion] unnecessary search: "${query}" — check snapshot coverage`);
          }
        }
      },

      onEnd({ steps, usage }: any) {
        console.log(`[notion:done] ${steps.length} steps | ${usage.totalTokens} tokens`);
        if (steps.length > 4) {
          console.warn("[notion] high step count — review prompt or snapshot coverage");
        }
      },
    });

    return {
      text: result.text,
      data: result.toolResults?.at(-1)?.output ?? {},
    };
  }

  private async fetchWorkspaceSnapshot(notion: Client): Promise<string> {
    const response = await notion.search({ query: "", page_size: 30 });
    const items = response.results.map((item: any) => ({
      id: item.id,
      type: item.object,
      title:
        item.properties?.title?.title?.[0]?.plain_text ??
        item.title?.[0]?.plain_text ??
        "(untitled)",
    }));
    return JSON.stringify(items, null, 2);
  }
}
