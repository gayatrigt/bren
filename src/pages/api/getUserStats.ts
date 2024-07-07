import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '~/server/db'
import { stack } from '~/server/stack'

function getStartOfWeek(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0));
}

async function getUserRankAndPoints(fid: number) {
    const ranking = await db.userRanking.findUnique({
        where: { fid },
        select: { rank: true, totalPoints: true, updatedAt: true }
    });

    return {
        rank: ranking?.rank || 0,
        pointsEarned: ranking?.totalPoints ? Number(ranking.totalPoints) : 0,
        lastUpdated: ranking?.updatedAt || null
    };
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

        // Get rank, points, and last updated time from the ranking table
        const { rank, pointsEarned, lastUpdated } = await getUserRankAndPoints(numericFid);

        if (!user && rank === 0) {
            return res.status(404).json({ error: 'User not found' })
        }

        let response: any = {
            rank,
            pointsEarned,
            lastRankUpdate: lastUpdated,
            startOfWeek
        };

        if (user) {
            // 5 & 6. Weekly allowance left and total allowance
            const totalAllowance = await getUserAllowance(user.walletAddress)
            const weeklyTransactions = await db.transaction.aggregate({
                where: {
                    fromAddress: user.walletAddress,
                    createdAt: { gte: startOfWeek },
                },
                _sum: { amount: true },
            })
            const weeklyAllowanceLeft = totalAllowance - (weeklyTransactions._sum.amount ? Number(weeklyTransactions._sum.amount) : 0)

            // 7. Get last 3 invited users' pfps
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

            // 8. Invites left
            const invitesUsed = await db.invite.count({
                where: {
                    invitorFid: numericFid,
                    createdAt: { gte: startOfWeek },
                },
            })
            const invitesLeft = 3 - invitesUsed

            response = {
                ...response,
                userType: user.type,
                username: user.username,
                pfp: user.pfp,
                weeklyAllowanceLeft,
                totalAllowance,
                recentInviteesPfps: invitedUsers.map(invite => invite.invitee?.pfp),
                invitesLeft,
            }
        }

        res.status(200).json(response)

    } catch (error) {
        console.error('Error fetching user data:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function getUserAllowance(wallet: string): Promise<number> {
    const allowance: number = await stack.getPoints(wallet)
    return allowance
}