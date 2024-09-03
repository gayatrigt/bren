import { User } from '@prisma/client'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
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
}

const TelegramLinkPage: React.FC<PageProps> = ({ error, currUser }) => {
    const { data: session } = useSession()

    console.log('Current User:', currUser)

    return (
        <section className="w-full">
            <div className="min-h-screen overflow-hidden w-full bg-Y-100 flex flex-col items-center mt-40">
                <img src="/icons/logo.svg" alt="Logo" className="w-24 h-24 mb-4" />
                <h1 className="text-4xl text-center font-bold">
                    Link Your Telegram Account
                </h1>
                {!session ? (
                    <div className="mt-6">
                        <SignInButton />

                    </div>
                ) : (
                    <div className="mt-6">
                        <h2 className="text-2xl font-semibold mb-2">Account Details: {session?.user.walletAddress}</h2>
                        {currUser?.tgUsername && <p>Telegram Username: {currUser.tgUsername}</p>}
                        <SignInButton />
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
            props: { error: 'Unauthorized' }
        }
    }

    const telegramUsername = context.query.telegramUsername as string | undefined

    console.log('Telegram Username:', telegramUsername)

    if (!telegramUsername) {
        return {
            props: { error: 'Missing TG username' }
        }
    }

    const isTelegramUsernameLinked = await db.user.findUnique({
        where: {
            tgUsername: telegramUsername
        }
    })

    if (isTelegramUsernameLinked) {
        return {
            props: { error: 'Telegram username is already linked', currUser: JSON.parse(JSON.stringify(isTelegramUsernameLinked)) }
        }
    }

    try {
        const currUser = await db.user.update({
            where: {
                id: session.user.id
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
            props: { currUser }
        }
    } catch (error) {
        console.error('Error updating user:', error)
        return {
            props: { error: 'Failed to update user' }
        }
    }
}

export default TelegramLinkPage