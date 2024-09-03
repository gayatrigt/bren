import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getCsrfToken } from "next-auth/react"
import { SiweMessage } from "siwe"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db } from "~/server/db"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Ethereum",
            credentials: {
                message: {
                    label: "Message",
                    type: "text",
                    placeholder: "0x0",
                },
                signature: {
                    label: "Signature",
                    type: "text",
                    placeholder: "0x0",
                },
            },
            async authorize(credentials, req) {
                console.log("Authorize function called with credentials:", credentials)
                try {
                    if (!credentials?.message) {
                        console.error("No message provided")
                        return null
                    }
                    const siwe = new SiweMessage(JSON.parse(credentials.message))
                    console.log("SIWE message parsed:", siwe)

                    const nextAuthUrl = new URL(process.env.NEXTAUTH_URL!)
                    console.log("NextAuth URL:", nextAuthUrl.toString())

                    console.log("Verifying SIWE message...")
                    const result = await siwe.verify({
                        signature: credentials.signature || "",
                        domain: nextAuthUrl.host,
                        nonce: siwe.nonce,
                    })

                    console.log("SIWE Verification Result:", result)

                    if (result.success) {
                        console.log("SIWE verification successful, upserting user...")
                        const user = await db.user.upsert({
                            where: { walletAddress: siwe.address },
                            update: {},
                            create: { walletAddress: siwe.address },
                        })

                        console.log("User upserted:", user)

                        return {
                            id: user.id,
                            walletAddress: user.walletAddress,
                        }
                    } else {
                        console.error("SIWE verification failed:", result.error)
                        return null
                    }
                } catch (e) {
                    console.error("Error in authorize function:", e)
                    return null
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(db),
    callbacks: {
        async session({ session, token }) {
            console.log("Session Callback - Token:", token)
            if (session.user) {
                session.user.id = token.sub!
                session.user.walletAddress = token.walletAddress as string
            }
            console.log("Session Callback - Updated Session:", session)
            return session
        },
        async jwt({ token, user }) {
            console.log("JWT Callback - User:", user)
            console.log("JWT Callback - Existing Token:", token)
            if (user) {
                token.walletAddress = user.walletAddress
            }
            console.log("JWT Callback - Updated Token:", token)
            return token
        },
    },
    debug: true,
}

export default NextAuth(authOptions)