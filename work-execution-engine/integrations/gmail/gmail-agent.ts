import { getModel } from "../../model";
import { generateText, tool } from "ai";
import { z } from "zod";
import { gmail_v1 } from "googleapis";
import { AgentNodeOutput } from "../../type";

export type GmailToolEmitter = (
  toolName: string,
  phase: "start" | "result",
  data: unknown
) => Promise<void>;

export async function runGmailAgent(
  gmail: gmail_v1.Gmail,
  userPrompt: string,
  nodeInput: AgentNodeOutput,
  onTool?: GmailToolEmitter
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
    system: `You are a Gmail workspace agent. Use the available tools to fulfill the user's request.
Be precise and efficient. Chain multiple tool calls if needed to complete the task.`,
    prompt,
    tools: {

      searchEmails: tool({
        description: "Search for emails in the user's Gmail account.",
        inputSchema: z.object({
          query: z.string().describe("The search query (Gmail search syntax, e.g. 'from:example@gmail.com is:unread')."),
          maxResults: z.number().int().min(1).max(50).default(10),
        }),
        execute: async ({ query, maxResults }) => {
          await onTool?.("searchEmails", "start", { query, maxResults });
          const response = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults,
          });
          const messages = response.data.messages || [];
          const results = [];
          
          for (const msg of messages) {
            if (!msg.id) continue;
            try {
              const msgData = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From', 'Date'],
              });
              const headers = msgData.data.payload?.headers || [];
              const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
              const from = headers.find(h => h.name === 'From')?.value || '(unknown sender)';
              const date = headers.find(h => h.name === 'Date')?.value || '(unknown date)';
              
              results.push({
                id: msg.id,
                threadId: msg.threadId,
                subject,
                from,
                date,
                snippet: msgData.data.snippet,
              });
            } catch (err) {
              console.error(`Failed to fetch message ${msg.id}`, err);
            }
          }
          await onTool?.("searchEmails", "result", results);
          return results;
        },
      }),

      readEmail: tool({
        description: "Read the full content of a specific email by its ID.",
        inputSchema: z.object({
          messageId: z.string().describe("The ID of the email message to read"),
        }),
        execute: async ({ messageId }) => {
          await onTool?.("readEmail", "start", { messageId });
          const response = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full',
          });
          
          let body = '';
          const parts = response.data.payload?.parts || [];
          
          if (parts.length === 0 && response.data.payload?.body?.data) {
             body = Buffer.from(response.data.payload.body.data, 'base64').toString('utf-8');
          } else {
            const textPart = parts.find(p => p.mimeType === 'text/plain');
            if (textPart && textPart.body?.data) {
               body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            } else {
               const htmlPart = parts.find(p => p.mimeType === 'text/html');
               if (htmlPart && htmlPart.body?.data) {
                   body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
               }
            }
          }
          
          const headers = response.data.payload?.headers || [];
          const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
          const from = headers.find(h => h.name === 'From')?.value || '(unknown)';
          const to = headers.find(h => h.name === 'To')?.value || '(unknown)';
          const date = headers.find(h => h.name === 'Date')?.value || '(unknown)';

          const result = {
            id: response.data.id,
            threadId: response.data.threadId,
            subject,
            from,
            to,
            date,
            body,
          };
          await onTool?.("readEmail", "result", result);
          return result;
        },
      }),

      sendEmail: tool({
        description: "Send a new email.",
        inputSchema: z.object({
          to: z.string().describe("Comma-separated list of recipient email addresses"),
          subject: z.string().describe("The subject of the email"),
          body: z.string().describe("The plain text body of the email"),
        }),
        execute: async ({ to, subject, body }) => {
          await onTool?.("sendEmail", "start", { to, subject, body });
          
          const messageParts = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'Content-Type: text/plain; charset=utf-8',
            '',
            body
          ];
          const message = messageParts.join('\n');
          const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
            
          const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: encodedMessage,
            },
          });
          
          const result = {
            messageId: response.data.id,
            threadId: response.data.threadId,
            labelIds: response.data.labelIds,
          };
          await onTool?.("sendEmail", "result", result);
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
