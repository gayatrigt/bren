import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '~/server/db'
import { User, getUserById } from '~/server/neynar';
import { stack } from '~/server/stack'
import { checkWhitelist } from './functions/checkWhiteList';
import { UserType } from '@prisma/client';

export function getStartOfWeek(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0));
}

async function getUserRank(fid: number) {
    const userDetails = await db.userRankings.findUnique({
        where: {
            fid: fid,
        },
    })
    const userRank = await db.userRankings.count({
        where: {
            tipsReceived: { gt: userDetails?.tipsReceived || 0 },
        },
    })

    return {
        rank: userRank + 1,
        tipsReceived: userDetails?.tipsReceived || 0
    }
}

async function getUserAllowance(wallet: string): Promise<number> {
    const allowance: number = await stack.getPoints(wallet);
    return allowance
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    const { fid } = req.query

    if (!fid || Array.isArray(fid)) {
        return res.status(400).json({ error: 'Invalid FID' })
    }

    try {
        const numericFid = parseInt(fid, 10)
        const startOfWeek = getStartOfWeek();

        // Get user data
        const user = await db.user.findUnique({
            where: { fid: numericFid },
            select: {
                type: true,
                username: true,
                pfp: true,
                walletAddress: true,
            },
        })

        // Get rank
        const details = await getUserRank(numericFid);
        const rank = details.rank;
        const pointsEarned = details.tipsReceived;

        let response: any = {
            rank,
            startOfWeek
        };

        if (!user) {
            const details = await getUserById(numericFid)

            if (details && details.verified_addresses.eth_addresses[0]) {
                const userEligibility: UserType | 'NOT_WHITELISTED' = await checkWhitelist(numericFid, details.verified_addresses.eth_addresses[0], details.power_badge)

                console.log(userEligibility)

                if (userEligibility !== 'NOT_WHITELISTED') {
                    let totalAllowance: number;
                    let invitesLeft: number;

                    if (userEligibility == "ALLIES") {
                        totalAllowance = 500
                        invitesLeft = 3
                    } else if (userEligibility == "SPLITTERS") {
                        totalAllowance = 100
                        invitesLeft = 3
                    } else if (userEligibility == "POWER_BADGE") {
                        totalAllowance = 300
                        invitesLeft = 0
                    } else if (userEligibility == "FOLLOWER") {
                        totalAllowance = 25
                        invitesLeft = 0
                    } else {
                        totalAllowance = 0
                        invitesLeft = 0
                    }

                    response = {
                        ...response,
                        userType: userEligibility,
                        weeklyAllowanceLeft: totalAllowance,
                        totalAllowance,
                        recentInviteesPfps: [],
                        invitesLeft,
                        pointsEarned: 0,
                    }
                    return res.status(200).json(response)
                }
            }
            return res.status(200).json({ error: 'User not found or not whitelisted' })
        }

        // User exists
        const totalAllowance = await getUserAllowance(user.walletAddress)
        const weeklyTransactions = await db.transaction.aggregate({
            where: {
                fromAddress: user.walletAddress,
                createdAt: { gte: startOfWeek },
            },
            _sum: { amount: true },
        })
        const weeklyAllowanceLeft = totalAllowance - (weeklyTransactions._sum.amount ? Number(weeklyTransactions._sum.amount) : 0)

        // Get last 3 invited users' pfps
        const invitedUsers = await db.invite.findMany({
            where: {
                invitorFid: numericFid,
                createdAt: { gte: startOfWeek },
            },
            include: {
                invitee: {
                    select: { pfp: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
        })

        // Invites left
        let invitesLeft = 0;
        if (user.type === UserType.ALLIES || user.type === UserType.SPLITTERS) {
            const invitesUsed = await db.invite.count({
                where: {
                    invitorFid: numericFid,
                    createdAt: { gte: startOfWeek },
                },
            })
            invitesLeft = 3 - invitesUsed
        }

        response = {
            ...response,
            userType: user.type,
            weeklyAllowanceLeft,
            totalAllowance,
            recentInviteesPfps: invitedUsers.map(invite => invite.invitee?.pfp),
            invitesLeft,
            rank,
            pointsEarned,
            startOfWeek
        }

        res.status(200).json(response)

    } catch (error) {
        console.error('Error fetching user data:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}