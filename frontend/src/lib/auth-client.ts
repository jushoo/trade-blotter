import { createAuthClient } from "better-auth/react"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

export const authClient = createAuthClient({
  baseURL: BASE_URL,
})

export const { signIn, signUp, signOut, useSession } = authClient
