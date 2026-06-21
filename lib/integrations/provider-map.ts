import { GoogleProvider } from "./providers/google-provider";

export const providers = {
    google: new GoogleProvider(),
} as const;