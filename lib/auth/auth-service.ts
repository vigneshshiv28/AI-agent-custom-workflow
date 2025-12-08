import { authClient } from "./auth-client";

export type EmailSignUpData = {
    email: string;
    password: string;
    name: string;
}

export type SignUpPayload =
    | { provider: 'email', data: EmailSignUpData, callbackURL: string }
    | { provider: 'google', callbackURL: string }

export type EmailLoginData = {
    email: string;
    password: string;
}

export type LoginPayload =
    | { provider: 'email', data: EmailLoginData, callbackURL: string }
    | { provider: 'google', callbackURL: string }

export const authService = {
    async signUp(payload: SignUpPayload) {
        switch (payload.provider) {
            case 'email':
                return authClient.signUp.email({
                    callbackURL: payload.callbackURL,
                    ...payload.data
                })
            case 'google':
                return authClient.signIn.social({
                    provider: 'google',
                    callbackURL: payload.callbackURL,
                })
            default:
                throw new Error('Invalid provider')
        }
    },

    async login(payload: LoginPayload) {
        switch (payload.provider) {
            case 'email':
                return authClient.signIn.email({
                    callbackURL: payload.callbackURL,
                    ...payload.data
                })
            case 'google':
                return authClient.signIn.social({
                    provider: 'google',
                    callbackURL: payload.callbackURL,
                })
            default:
                throw new Error('Invalid provider')
        }
    }
}