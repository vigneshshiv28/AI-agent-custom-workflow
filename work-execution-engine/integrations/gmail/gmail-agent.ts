import { ToolLoopAgent, tool, isStepCount, isLoopFinished } from "ai";
import { z } from "zod";
import { gmail_v1 } from "googleapis";
import { getModel } from "../../model";

export function createGmailAgent(gmail: gmail_v1.Gmail) {
  return new ToolLoopAgent({
    model: getModel(),
    stopWhen: [
      isLoopFinished(),
      isStepCount(6),
    ],

    instructions: `You are a Gmail agent. Use the available tools to fulfill the user's request.

    EXECUTION RULES:
    - Never ask for confirmation, never pause, never say "should I proceed?"
    - If the task is clear → act immediately
    - If something is ambiguous → make the most reasonable assumption, act, then state what you assumed
    - If the task is impossible (missing recipient, no matching email found) → explain why and stop

    ASSUMPTION EXAMPLES:
    - "reply to john" + multiple Johns found → reply to the most recent one, state which you picked
    - "send update to the team" + no team defined → stop, explain what's missing
    - "forward the invoice" + multiple invoices → pick the most recent, state which you picked

    TOOL USAGE RULES:
    - If the task has a known recipient/subject/body → call sendEmail directly, no search needed
    - If the task references "latest", "recent", "from X", "unread" → call searchEmails first, then act
    - Never search for something you already have

    GMAIL QUERY SYNTAX (for searchEmails):
    - from:john@example.com
    - is:unread has:attachment
    - after:2026/06/01 subject:invoice
    - Combine freely: from:boss is:unread after:2026/06/20

    OUTPUT:
    - Always report: what action was taken, to whom, with what subject
    - If you made an assumption, state it clearly in the output
    - If action failed, explain why`,

    tools: {
      searchEmails: tool({
        description: "Search for emails in the user's Gmail account.",
        inputSchema: z.object({
          query: z.string().describe("The search query (Gmail search syntax, e.g. 'from:example@gmail.com is:unread')."),
          maxResults: z.number().int().min(1).max(50).default(10),
        }),
        execute: async ({ query, maxResults }) => {
          try {
            const response = await gmail.users.messages.list({
              userId: 'me',
              ...(query ? { q: query } : {}),
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
            return results;
          } catch (error) {
            console.error("Error in searchEmails tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      readEmail: tool({
        description: "Read the full content of a specific email by its ID.",
        inputSchema: z.object({
          messageId: z.string().describe("The ID of the email message to read"),
        }),
        execute: async ({ messageId }) => {
          try {
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

            return {
              id: response.data.id,
              threadId: response.data.threadId,
              subject,
              from,
              to,
              date,
              body,
            };
          } catch (error) {
            console.error("Error in readEmail tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
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
          try {
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

            return {
              messageId: response.data.id,
              threadId: response.data.threadId,
              labelIds: response.data.labelIds,
            };
          } catch (error) {
            console.error("Error in sendEmail tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),
    },
  });
}
