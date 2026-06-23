import { GoogleProvider } from "./providers/google-provider";
import { NotionProvider } from "./providers/notion-provider";

export const providers = {
    google: new GoogleProvider(),
    notion: new NotionProvider(),
} as const;