import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getStartOfWeek, getUserAllowance } from './getUserStats';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fid } = req.query;

    if (!fid || Array.isArray(fid)) {
        return res.status(400).json({ error: 'Invalid FID provided' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { fid: parseInt(fid) }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const startOfWeek = getStartOfWeek();
        const totalAllowance = await getUserAllowance(user.walletAddress);

        const weeklyTransactions = await prisma.transaction.aggregate({
            where: {
                fromAddress: user.walletAddress,
                createdAt: { gte: startOfWeek },
            },
            _sum: { amount: true },
        });

        const weeklySpent = weeklyTransactions._sum.amount ? Number(weeklyTransactions._sum.amount) : 0;
        const weeklyAllowanceLeft = totalAllowance - weeklySpent;

        res.status(200).json({
            fid: user.fid,
            username: user.username,
            totalAllowance: totalAllowance,
            weeklySpent: weeklySpent,
            weeklyAllowanceLeft: weeklyAllowanceLeft
        });

    } catch (error) {
        console.error('Error fetching user allowance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
