import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            walletAddress?: string | null
        } & DefaultSession["user"]
    }

    interface User {
        walletAddress?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        walletAddress?: string | null
    }
}