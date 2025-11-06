import {google} from "@ai-sdk/google"
import { streamText,generateText,tool } from 'ai';


export async function runSummarizer(userPrompt:string = "", nodeInput:string = ""){

    const prompt = userPrompt+nodeInput

    const result = await  generateText({
        model: google("gemini-2.5-flash"),
        system: "You are summarizer agent you will summarize input you will get",
        prompt: prompt
    })

    return result.text
}

