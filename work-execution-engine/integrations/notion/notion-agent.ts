import { getModel } from "../../model";
import { generateText, tool } from "ai";
import { z } from "zod";
import { Client } from "@notionhq/client";
import { AgentNodeOutput } from "../../type";

export type NotionToolEmitter = (
  toolName: string,
  phase: "start" | "result",
  data: unknown
) => Promise<void>;

export async function runNotionAgent(
  notion: Client,
  userPrompt: string,
  nodeInput: AgentNodeOutput,
  onTool?: NotionToolEmitter
): Promise<AgentNodeOutput> {

  const prompt = `
===== WORKSPACE CONTEXT =====
Previous node output (text):
${nodeInput?.text ?? "(none)"}

Previous node output (data):
${JSON.stringify(nodeInput?.data ?? {}, null, 2)}

===== YOUR TASK =====
${userPrompt}
`;

  const result = await generateText({
    model: getModel(),
    system: `You are a Notion workspace agent. Use the available tools to fulfill the user's request.
Be precise and efficient. Chain multiple tool calls if needed to complete the task.`,
    prompt,
    tools: {

      search: tool({
        description: "Search across the Notion workspace for pages and databases by keyword.",
        inputSchema: z.object({
          query: z.string().describe("The search query text"),
          filterType: z
            .enum(["page", "database"])
            .optional()
            .describe("Optionally filter results to only pages or only databases"),
          pageSize: z.number().int().min(1).max(100).default(10),
        }),
        execute: async ({ query, filterType, pageSize }) => {
          await onTool?.("search", "start", { query, filterType, pageSize });
          const response = await notion.search({
            query,
            ...(filterType && { filter: { value: filterType, property: "object" } }),
            page_size: pageSize,
          });
          const results = response.results.map((item: any) => ({
            id: item.id,
            type: item.object,
            url: item.url,
            title:
              item.properties?.title?.title?.[0]?.plain_text ??
              item.title?.[0]?.plain_text ??
              "(untitled)",
            lastEditedTime: item.last_edited_time,
          }));
          await onTool?.("search", "result", results);
          return results;
        },
      }),

      queryDatabase: tool({
        description: "Query a Notion database with optional filters and sort orders.",
        inputSchema: z.object({
          databaseId: z.string().describe("The ID of the Notion database to query"),
          filter: z
            .record(z.string(), z.any())
            .optional()
            .describe("Notion filter object (see Notion API docs)"),
          sorts: z
            .array(z.record(z.string(), z.any()))
            .optional()
            .describe("Array of sort objects"),
          pageSize: z.number().int().min(1).max(100).default(10),
        }),
        execute: async ({ databaseId, filter, sorts, pageSize }) => {
          await onTool?.("queryDatabase", "start", { databaseId, filter, sorts, pageSize });
          const response = await notion.databases.query({
            database_id: databaseId,
            ...(filter && { filter: filter as any }),
            ...(sorts && { sorts: sorts as any }),
            page_size: pageSize,
          });
          const result = {
            results: response.results.map((page: any) => ({
              id: page.id,
              url: page.url,
              properties: page.properties,
              createdTime: page.created_time,
              lastEditedTime: page.last_edited_time,
            })),
            hasMore: response.has_more,
            nextCursor: response.next_cursor ?? null,
          };
          await onTool?.("queryDatabase", "result", result);
          return result;
        },
      }),

      getPage: tool({
        description: "Retrieve a single Notion page by its ID.",
        inputSchema: z.object({
          pageId: z.string().describe("The ID of the page to retrieve"),
        }),
        execute: async ({ pageId }) => {
          await onTool?.("getPage", "start", { pageId });
          const page = await notion.pages.retrieve({ page_id: pageId }) as any;
          const result = {
            id: page.id,
            url: page.url,
            createdTime: page.created_time,
            lastEditedTime: page.last_edited_time,
            archived: page.archived,
            properties: page.properties,
          };
          await onTool?.("getPage", "result", result);
          return result;
        },
      }),

      createPage: tool({
        description: "Create a new Notion page inside a database or as a child of another page.",
        inputSchema: z.object({
          parentId: z.string().describe("ID of the parent database or page"),
          parentType: z
            .enum(["database_id", "page_id"])
            .default("database_id")
            .describe("Whether the parent is a database or a page"),
          properties: z
            .record(z.string(), z.any())
            .describe("Page properties — must match the parent database schema"),
          content: z
            .string()
            .optional()
            .describe("Optional plain-text content to add as a paragraph block"),
        }),
        execute: async ({ parentId, parentType, properties, content }) => {
          await onTool?.("createPage", "start", { parentId, parentType, content });
          const children: any[] = content
            ? [{
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ type: "text", text: { content } }],
                },
              }]
            : [];
          const response = await notion.pages.create({
            parent: { [parentType]: parentId } as any,
            properties: properties as any,
            ...(children.length > 0 && { children: children as any }),
          });
          const page = response as any;
          const result = {
            pageId: page.id,
            url: page.url,
            createdTime: page.created_time,
          };
          await onTool?.("createPage", "result", result);
          return result;
        },
      }),

      updatePage: tool({
        description: "Update properties of an existing Notion page, or archive/restore it.",
        inputSchema: z.object({
          pageId: z.string().describe("The ID of the page to update"),
          properties: z
            .record(z.string(), z.any())
            .optional()
            .describe("Properties to update"),
          archived: z
            .boolean()
            .optional()
            .describe("Set to true to archive (soft-delete) the page"),
        }),
        execute: async ({ pageId, properties, archived }) => {
          await onTool?.("updatePage", "start", { pageId, archived });
          const response = await (notion.pages.update as any)({
            page_id: pageId,
            ...(properties && { properties }),
            ...(archived !== undefined && { archived }),
          });
          const page = response as any;
          const result = {
            pageId: page.id,
            url: page.url,
            archived: page.archived,
            lastEditedTime: page.last_edited_time,
          };
          await onTool?.("updatePage", "result", result);
          return result;
        },
      }),

      appendBlocks: tool({
        description: "Append plain-text content to an existing Notion page or block.",
        inputSchema: z.object({
          blockId: z.string().describe("ID of the page or block to append content to"),
          text: z.string().describe("Plain-text content to append as a paragraph block"),
        }),
        execute: async ({ blockId, text }) => {
          await onTool?.("appendBlocks", "start", { blockId, text });
          const response = await notion.blocks.children.append({
            block_id: blockId,
            children: [{
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [{ type: "text", text: { content: text } }],
              },
            }],
          });
          const result = { blockId, appended: response.results.length };
          await onTool?.("appendBlocks", "result", result);
          return result;
        },
      }),

    },
  });

  const lastToolOutput = result.toolResults?.at(-1)?.output ?? {};

  return {
    text: result.text,
    data: typeof lastToolOutput === "object"
      ? (lastToolOutput as Record<string, any>)
      : { result: lastToolOutput },
  };
}
