import { ToolLoopAgent, tool, isStepCount, isLoopFinished } from "ai";
import { z } from "zod";
import { calendar_v3 } from "googleapis";
import { getModel } from "../../model";

export function createGoogleCalendarAgent(calendar: calendar_v3.Calendar) {
  return new ToolLoopAgent({
    model: getModel(),
    stopWhen: [
      isLoopFinished(),
      isStepCount(6),
    ],

    instructions: `You are a Google Calendar agent. Use the available tools to fulfill the user's request.

    EXECUTION RULES:
    - Never ask for confirmation, never pause, never say "should I proceed?"
    - If the task is clear → act immediately
    - If something is ambiguous → make the most reasonable assumption, act, then state what you assumed
    - If the task is impossible (e.g. no available time found) → explain why and stop
    - TIMEZONES: Be extremely careful with timezones! If the user or context specifies a timezone (e.g., IST, EST), you MUST convert it correctly to an RFC3339 timestamp before passing it to tools. Do NOT just append 'Z' to the local time. (e.g., 5 PM IST is UTC+05:30, so use the offset +05:30 or convert to UTC).

    ASSUMPTION EXAMPLES:
    - "schedule a meeting with john tomorrow" → pick a reasonable working hour free slot, act, then state when you scheduled it
    - "reschedule my 3pm to 4pm" → find the 3pm event today, update it to 4pm, and state what was changed

    TOOL USAGE RULES:
    - Use 'listEvents' to find existing events.
    - Use 'checkConflicts' before creating an event if the time is strictly requested but might be booked.
    - Use 'findAvailableTime' to find a free slot for scheduling when the time is flexible.

    OUTPUT:
    - Always report: what action was taken, at what time, and with whom.
    - If you made an assumption (like picking an available time), state it clearly.
    - If action failed, explain why.`,

    tools: {
      listEvents: tool({
        description: "List or search for events in the primary calendar.",
        inputSchema: z.object({
          query: z.string().optional().describe("Free text search terms to find events that match these terms in any field, except for extended properties."),
          timeMin: z.string().optional().describe("Lower bound (exclusive) for an event's end time to filter by. RFC3339 timestamp (e.g., 2026-06-27T10:00:00Z)."),
          timeMax: z.string().optional().describe("Upper bound (exclusive) for an event's start time to filter by. RFC3339 timestamp."),
          maxResults: z.number().int().min(1).max(100).default(10),
        }),
        execute: async ({ query, timeMin, timeMax, maxResults }) => {
          try {
            const response = await calendar.events.list({
              calendarId: 'primary',
              q: query,
              timeMin,
              timeMax,
              maxResults,
              singleEvents: true,
              orderBy: 'startTime',
            });
            return response.data.items?.map(item => ({
              id: item.id,
              summary: item.summary,
              start: item.start?.dateTime || item.start?.date,
              end: item.end?.dateTime || item.end?.date,
              status: item.status,
              attendees: item.attendees?.map(a => a.email),
              htmlLink: item.htmlLink,
            })) || [];
          } catch (error) {
            console.error("Error in listEvents tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      getCalendarEvent: tool({
        description: "Get the details of a specific calendar event by its ID.",
        inputSchema: z.object({
          eventId: z.string().describe("The ID of the event to retrieve."),
        }),
        execute: async ({ eventId }) => {
          try {
            const response = await calendar.events.get({
              calendarId: 'primary',
              eventId,
            });
            const item = response.data;
            return {
              id: item.id,
              summary: item.summary,
              description: item.description,
              start: item.start?.dateTime || item.start?.date,
              end: item.end?.dateTime || item.end?.date,
              status: item.status,
              attendees: item.attendees?.map(a => a.email),
              htmlLink: item.htmlLink,
              location: item.location,
            };
          } catch (error) {
            console.error("Error in getCalendarEvent tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      createEvent: tool({
        description: "Create a new event in the primary calendar.",
        inputSchema: z.object({
          summary: z.string().describe("Title of the event."),
          description: z.string().optional().describe("Description of the event."),
          startDateTime: z.string().describe("Start time of the event as an RFC3339 timestamp (e.g., 2026-06-27T10:00:00Z)."),
          endDateTime: z.string().describe("End time of the event as an RFC3339 timestamp."),
          attendees: z.array(z.string()).optional().describe("List of attendee email addresses."),
        }),
        execute: async ({ summary, description, startDateTime, endDateTime, attendees }) => {
          try {
            const response = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: {
                summary,
                description,
                start: { dateTime: startDateTime },
                end: { dateTime: endDateTime },
                attendees: attendees ? attendees.map(email => ({ email })) : undefined,
              },
            });
            const item = response.data;
            return {
              id: item.id,
              summary: item.summary,
              status: item.status,
              htmlLink: item.htmlLink,
            };
          } catch (error) {
            console.error("Error in createEvent tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      updateEvent: tool({
        description: "Update an existing event in the primary calendar.",
        inputSchema: z.object({
          eventId: z.string().describe("The ID of the event to update."),
          summary: z.string().optional().describe("New title for the event."),
          description: z.string().optional().describe("New description."),
          startDateTime: z.string().optional().describe("New start time (RFC3339)."),
          endDateTime: z.string().optional().describe("New end time (RFC3339)."),
          attendees: z.array(z.string()).optional().describe("New list of attendee emails. This replaces the existing list."),
        }),
        execute: async ({ eventId, summary, description, startDateTime, endDateTime, attendees }) => {
          try {
            const response = await calendar.events.patch({
              calendarId: 'primary',
              eventId,
              requestBody: {
                ...(summary && { summary }),
                ...(description && { description }),
                ...(startDateTime && { start: { dateTime: startDateTime } }),
                ...(endDateTime && { end: { dateTime: endDateTime } }),
                ...(attendees && { attendees: attendees.map(email => ({ email })) }),
              },
            });
            const item = response.data;
            return {
              id: item.id,
              summary: item.summary,
              status: item.status,
              htmlLink: item.htmlLink,
            };
          } catch (error) {
            console.error("Error in updateEvent tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      deleteEvent: tool({
        description: "Delete an event from the primary calendar.",
        inputSchema: z.object({
          eventId: z.string().describe("The ID of the event to delete."),
        }),
        execute: async ({ eventId }) => {
          try {
            await calendar.events.delete({
              calendarId: 'primary',
              eventId,
            });
            return { success: true, eventId };
          } catch (error) {
            console.error("Error in deleteEvent tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      checkConflicts: tool({
        description: "Check if there are any conflicting events within a specific time range.",
        inputSchema: z.object({
          startDateTime: z.string().describe("Start time of the range (RFC3339)."),
          endDateTime: z.string().describe("End time of the range (RFC3339)."),
        }),
        execute: async ({ startDateTime, endDateTime }) => {
          try {
            const response = await calendar.events.list({
              calendarId: 'primary',
              timeMin: startDateTime,
              timeMax: endDateTime,
              singleEvents: true,
            });
            const items = response.data.items || [];
            const busyItems = items.filter(item => item.transparency !== 'transparent');
            
            return {
              hasConflicts: busyItems.length > 0,
              conflictingEvents: busyItems.map(item => ({
                id: item.id,
                summary: item.summary,
                start: item.start?.dateTime || item.start?.date,
                end: item.end?.dateTime || item.end?.date,
              })),
            };
          } catch (error) {
            console.error("Error in checkConflicts tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

      findAvailableTime: tool({
        description: "Find available time slots of a certain duration within a time window.",
        inputSchema: z.object({
          durationMinutes: z.number().int().describe("Required duration of the free slot in minutes."),
          searchStart: z.string().describe("Start of the search window (RFC3339)."),
          searchEnd: z.string().describe("End of the search window (RFC3339)."),
          workingHoursStart: z.number().int().optional().describe("Start of working hours (0-23). Defaults to 9."),
          workingHoursEnd: z.number().int().optional().describe("End of working hours (0-23). Defaults to 17."),
        }),
        execute: async ({ durationMinutes, searchStart, searchEnd, workingHoursStart = 9, workingHoursEnd = 17 }) => {
          try {
            const response = await calendar.freebusy.query({
              requestBody: {
                timeMin: searchStart,
                timeMax: searchEnd,
                items: [{ id: 'primary' }],
              }
            });
            
            const busySlots = response.data.calendars?.['primary']?.busy || [];
            
            const slots = [];
            let current = new Date(searchStart);
            const end = new Date(searchEnd);
            
            while (current < end) {
              const currentHour = current.getHours();
              if (currentHour >= workingHoursStart && currentHour + (durationMinutes / 60) <= workingHoursEnd) {
                const slotEnd = new Date(current.getTime() + durationMinutes * 60000);
                
                if (slotEnd > end) break;
                
                const hasOverlap = busySlots.some(busy => {
                  if (!busy.start || !busy.end) return false;
                  const bStart = new Date(busy.start);
                  const bEnd = new Date(busy.end);
                  return (current < bEnd && slotEnd > bStart);
                });
                
                if (!hasOverlap) {
                  slots.push({
                    start: current.toISOString(),
                    end: slotEnd.toISOString()
                  });
                  if (slots.length >= 5) break; // return max 5 slots
                }
              }
              // increment by 30 mins
              current = new Date(current.getTime() + 30 * 60000);
            }
            
            return { availableSlots: slots };
          } catch (error) {
            console.error("Error in findAvailableTime tool:", error);
            return { _error: error instanceof Error ? error.message : String(error) };
          }
        },
      }),

    }
  });
}
