import { User } from '@prisma/client'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import Link from 'next/link'
import { stringify } from 'querystring'
import React from 'react'
import SignInButton from '~/components/SIWE'
import { db } from '~/server/db'

type SimplifiedUser = {
    id: string;
    walletAddress: string | null;
    fid: number | null;
    tgUsername: string | null;
}

type PageProps = {
    error?: string;
    currUser?: SimplifiedUser;
    excludeNavbar: boolean;
}

const TelegramLinkPage: React.FC<PageProps> = ({ error, currUser, excludeNavbar }) => {
    const { data: session } = useSession()

    console.log('Current User:', currUser)

    return (
        <section className="w-full">
            <div className="min-h-screen overflow-hidden w-full bg-Y-100 flex flex-col items-center">
                <img src="/icons/logo.svg" alt="Logo" className="w-24 h-24 mb-4" />
                {!session ? (
                    <div className="mt-6 flex flex-col items-center">
                        <h1 className="text-4xl text-center font-bold mb-4">
                            Connect Your Wallet with Your
                            <br /> Telegram Account
                        </h1>
                        <SignInButton />
                    </div>
                ) : (
                    <div className="mt-6 flex flex-col items-center">
                        <h1 className="text-4xl text-center font-bold mb-4">
                            That is a success bren!
                        </h1>
                        <h2 className="text-xl font-normal mb-6">Wallet Address: {session?.user.walletAddress}
                            <br />is connected with
                            <br /> Telegram Username: {currUser?.tgUsername}
                        </h2>
                        <Link href="/">
                            <button
                                className="rounded border border-p-100 bg-white px-4 py-2 font-bold text-pu-100
               shadow-[3px_3px_0px_0px_#000] text-lg hover:bg-pu-100 hover:text-white transition-colors"
                            >
                                Checkout bren Leaderboard
                            </button>
                        </Link>

                    </div>
                )}
            </div>
        </section>
    )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
    const session = await getSession(context)

    if (!session) {
        return {
            props: { error: 'Unauthorized', excludeNavbar: true }
        }
    }

    if (!session.user.walletAddress) {
        return {
            props: { error: 'No wallet connected', excludeNavbar: true }
        }
    }

    const telegramUsername = context.query.telegramUsername as string | undefined

    console.log('Telegram Username:', telegramUsername)

    if (!telegramUsername) {
        return {
            props: { error: 'Missing TG username', excludeNavbar: true }
        }
    }

    const isTelegramUsernameLinked = await db.user.findUnique({
        where: {
            tgUsername: telegramUsername
        }
    })

    // if (isTelegramUsernameLinked) {
    //     return {
    //         props: { error: 'Telegram username is already linked', currUser: JSON.parse(JSON.stringify(isTelegramUsernameLinked)), excludeNavbar: true }
    //     }
    // }

    try {
        // Check if the wallet address exists in the user table
        const existingUser = await db.user.findUnique({
            where: {
                walletAddress: session.user.walletAddress
            }
        })

        if (existingUser) {
            // If the user exists, update the tgUsername
            const updatedUser = await db.user.update({
                where: {
                    id: existingUser.id
                },
                data: {
                    tgUsername: telegramUsername
                },
                select: {
                    id: true,
                    walletAddress: true,
                    fid: true,
                    tgUsername: true,
                }
            })

            return {
                props: { currUser: JSON.parse(JSON.stringify(updatedUser)), excludeNavbar: true }
            }
        } else {
            // Check if the tg username exists in the user table
            const existingUserTG = await db.user.findUnique({
                where: {
                    tgUsername: telegramUsername
                }
            })

            if (existingUserTG) {
                const newUser = await db.user.update({
                    where: {
                        tgUsername: telegramUsername
                    },
                    data: {
                        walletAddress: session.user.walletAddress,
                        tgUsername: telegramUsername
                    },
                    select: {
                        id: true,
                        walletAddress: true,
                        fid: true,
                        tgUsername: true,
                    }
                })
                return {
                    props: { currUser: JSON.parse(JSON.stringify(newUser)), excludeNavbar: true }
                }
            } else {
                // If the user doesn't exist, create a new user with the wallet address as tgUsername
                const newUser = await db.user.create({
                    data: {
                        walletAddress: session.user.walletAddress,
                        tgUsername: telegramUsername
                    },
                    select: {
                        id: true,
                        walletAddress: true,
                        fid: true,
                        tgUsername: true,
                    }
                })
                return {
                    props: { currUser: JSON.parse(JSON.stringify(newUser)), excludeNavbar: true }
                }
            }
        }
    } catch (error) {
        console.error('Error updating user:', error)
        return {
            props: { error: 'Failed to update user', excludeNavbar: true }
        }
    }
}

export default TelegramLinkPage