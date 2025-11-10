import {google} from "@ai-sdk/google"
import { streamText,generateText,tool, Output } from 'ai';
import { z } from 'zod';
import { AgentNodeOutput,ConditionNodeOutput } from "../type";

export async function runWeatherAgent(userPrompt:string = "", nodeInput:AgentNodeOutput){

  const prompt = `
  ===== INPUT =====
  Text Content:
  ${nodeInput?.text ?? ""}

  Structured Data:
  ${JSON.stringify(nodeInput?.data ?? {}, null, 2)}

  ===== TASK =====
  ${userPrompt}
`;

  const result = await generateText({
      model: google('gemini-2.5-flash'),
      tools: {
        weather: tool({
          description: 'Get the weather in a location',
          inputSchema: z.object({
            location: z.string().describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => ({
            location,
            temperature: 72 + Math.floor(Math.random() * 21) - 10,
          }),
        }),
      },
    
      prompt: prompt,
      
    });

    const toolCall = result.toolResults[0].output

    return {
        text: result.text,
        data: toolCall ? toolCall:{}  
    }
}

