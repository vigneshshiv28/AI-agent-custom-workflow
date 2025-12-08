import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: process.env.CLIENT_BASE_URL,
})