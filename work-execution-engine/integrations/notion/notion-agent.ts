import { ToolLoopAgent, tool, isStepCount, isLoopFinished } from "ai";
import { z } from "zod";
import { Client } from "@notionhq/client";
import { getModel } from "../../model";

export function createNotionAgent(notion: Client) {
  return new ToolLoopAgent({
    model: getModel(),
    stopWhen: [
      isLoopFinished(), // natural stop — model said it's done
      isStepCount(6),   // safety ceiling — something went wrong
    ],
    
    instructions: `You are a Notion workspace agent.
Use the available tools to fulfill the user's request.
The WORKSPACE_SNAPSHOT in your prompt lists all existing pages and databases with their IDs.
Use those IDs directly — only call 'search' if you need something NOT in the snapshot.
Be precise and efficient. Chain tool calls if needed.`,

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
          try {
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
            return results;
          } catch (error) {
            console.error("Error in search tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
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
            .array(z.object({
              property: z.string().optional(),
              timestamp: z.enum(["created_time", "last_edited_time"]).optional(),
              direction: z.enum(["ascending", "descending"]).optional()
            }))
            .optional()
            .describe("Array of sort objects"),
          pageSize: z.number().int().min(1).max(100).default(10),
        }),
        execute: async ({ databaseId, filter, sorts, pageSize }) => {
          try {
            const response = await notion.databases.query({
              database_id: databaseId,
              ...(filter && { filter: filter as any }),
              ...(sorts && { sorts: sorts as any }),
              page_size: pageSize,
            });
            return {
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
          } catch (error) {
            console.error("Error in queryDatabase tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      getPage: tool({
        description: "Retrieve a single Notion page by its ID.",
        inputSchema: z.object({
          pageId: z.string().describe("The ID of the page to retrieve"),
        }),
        execute: async ({ pageId }) => {
          try {
            const page = await notion.pages.retrieve({ page_id: pageId }) as any;
            return {
              id: page.id,
              url: page.url,
              createdTime: page.created_time,
              lastEditedTime: page.last_edited_time,
              archived: page.archived,
              properties: page.properties,
            };
          } catch (error) {
            console.error("Error in getPage tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      createPage: tool({
        description: "Create a new Notion page. You MUST provide a parentId. If you don't know the parentId, use the 'search' tool FIRST to find a parent page or database, and THEN call 'createPage' with the found ID.",
        inputSchema: z.object({
          parentId: z.string().describe("ID of the parent database or page"),
          parentType: z
            .enum(["database_id", "page_id"])
            .default("page_id")
            .describe("Whether the parent is a database or a page. Defaults to page_id."),
          title: z.string().describe("The title of the new page"),
          properties: z
            .record(z.string(), z.any())
            .optional()
            .describe("Additional properties if parent is a database. E.g. { Name: { title: [...] } }"),
          content: z
            .string()
            .optional()
            .describe("Optional plain-text content to add as a paragraph block"),
        }),
        execute: async ({ parentId, parentType, title, properties, content }) => {
          try {
            const children: any[] = content
              ? [{
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ type: "text", text: { content } }],
                },
              }]
              : [];
            let finalProperties: any = { ...(properties || {}) };

            if (parentType === "page_id") {
              finalProperties.title = {
                title: [{ type: "text", text: { content: title } }]
              };
            } else if (!finalProperties.title && !finalProperties.Name && Object.keys(finalProperties).length === 0) {
              finalProperties["Name"] = {
                title: [{ type: "text", text: { content: title } }]
              };
            }

            const response = await notion.pages.create({
              parent: { [parentType]: parentId } as any,
              properties: finalProperties,
              ...(children.length > 0 && { children: children as any }),
            });
            const page = response as any;
            return {
              pageId: page.id,
              url: page.url,
              createdTime: page.created_time,
            };
          } catch (error) {
            console.error("Error in createPage tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
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
          try {
            const response = await (notion.pages.update as any)({
              page_id: pageId,
              ...(properties && { properties }),
              ...(archived !== undefined && { archived }),
            });
            const page = response as any;
            return {
              pageId: page.id,
              url: page.url,
              archived: page.archived,
              lastEditedTime: page.last_edited_time,
            };
          } catch (error) {
            console.error("Error in updatePage tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      appendBlocks: tool({
        description: "Append plain-text content to an existing Notion page or block.",
        inputSchema: z.object({
          blockId: z.string().describe("ID of the page or block to append content to"),
          text: z.string().describe("Plain-text content to append as a paragraph block"),
        }),
        execute: async ({ blockId, text }) => {
          try {
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
            return { blockId, appended: response.results.length };
          } catch (error) {
            console.error("Error in appendBlocks tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

    },
  });
}
