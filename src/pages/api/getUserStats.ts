import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '~/server/db'
import { stack } from '~/server/stack'

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

        // 1, 2, 3. Get UserType, Username, and Pfp
        const user = await db.user.findUnique({
            where: { fid: numericFid },
            select: {
                type: true,
                username: true,
                pfp: true,
                walletAddress: true,
            },
        })

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // 4. Calculate points earned
        const pointsEarned = await db.transaction.aggregate({
            where: { toFid: numericFid },
            _sum: { amount: true },
        })

        // 5 & 6. Weekly allowance left and total allowance
        const now = new Date()
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        const totalAllowance = await getUserAllowance(user.walletAddress)
        const weeklyTransactions = await db.transaction.aggregate({
            where: {
                fromAddress: user.walletAddress,
                createdAt: { gte: weekAgo },
            },
            _sum: { amount: true },
        })
        const weeklyAllowanceLeft = totalAllowance - (weeklyTransactions._sum.amount || 0)

        // 7. Get last 3 invited users' pfps
        const invitedUsers = await db.invite.findMany({
            where: {
                invitorFid: numericFid,
                createdAt: { gte: weekAgo },
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
                createdAt: { gte: weekAgo },
            },
        })
        const invitesLeft = 3 - invitesUsed

        res.status(200).json({
            userType: user.type,
            username: user.username,
            pfp: user.pfp,
            pointsEarned: pointsEarned._sum.amount || 0,
            weeklyAllowanceLeft,
            totalAllowance,
            recentInviteesPfps: invitedUsers.map(invite => invite.invitee?.pfp),
            invitesLeft,
        })

    } catch (error) {
        console.error('Error fetching user data:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function getUserAllowance(wallet: string): Promise<number> {
    const allowance: number = await stack.getPoints(wallet)
    return allowance
}