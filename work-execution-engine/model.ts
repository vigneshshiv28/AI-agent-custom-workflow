import { google } from "@ai-sdk/google";

export function getModel() {
  const provider = process.env.AI_PROVIDER ?? "google";
  const model = process.env.AI_MODEL ?? "gemini-2.5-flash";

  switch (provider) {
    case "google":
      return google(model);

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
