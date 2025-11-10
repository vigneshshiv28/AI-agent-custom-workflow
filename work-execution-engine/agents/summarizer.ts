import {google} from "@ai-sdk/google"
import { generateText } from 'ai';
import { AgentNodeOutput } from "../type";


export async function runSummarizer(userPrompt:string = "", nodeInput:AgentNodeOutput){

    const prompt = `
    ===== INPUT =====
    Text Content:
    ${nodeInput?.text ?? ""}

    Structured Data:
    ${JSON.stringify(nodeInput?.data ?? {}, null, 2)}

    ===== TASK =====
    ${userPrompt}
  `;

    const result = await  generateText({
        model: google("gemini-2.5-flash"),
        system: "You are summarizer agent you will summarize input you will get",
        prompt: prompt
    })

    const toolCall = result.toolResults[0].output

    return {
        text: result.text,
        data: toolCall ? toolCall:{}  
    }
}

