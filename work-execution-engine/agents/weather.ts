import {google} from "@ai-sdk/google"
import { streamText,generateText,tool, Output } from 'ai';
import { z } from 'zod';

const outputSchema = z.object({
  location: z.string(),
  temperature: z.number(),
})

export async function runWeatherAgent(userPrompt:string = "", nodeInput:string = ""){

    const prompt = userPrompt + nodeInput

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

      const parseResult = outputSchema.safeParse(result.toolResults[0].output)

      if(parseResult.error){
        throw new Error(parseResult.error.message)
      }

      const agentRes = `location: ${parseResult.data.location} ### temperature: ${parseResult.data.temperature}`
      return agentRes
}

