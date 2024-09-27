import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { walletAddress } = req.query;

    if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }

    try {
        const user = await db.user.findUnique({
            where: { walletAddress },
            include: {
                weeklyPoints: {
                    orderBy: { weekStart: 'desc' },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const totalPoints = user.weeklyPoints.reduce((sum, week) => sum + week.pointsEarned, 0);

        const weeklyPoints = user.weeklyPoints.map(week => ({
            weekStart: week.weekStart.toISOString().split('T')[0], // Format as YYYY-MM-DD
            points: week.pointsEarned,
            platform: week.platform,
        }));

        const lastUpdated = user.weeklyPoints.length > 0
            ? user.weeklyPoints[0]?.weekStart.toISOString()
            : null;

        return res.status(200).json({
            walletAddress: user.walletAddress,
            totalPoints,
            weeklyPoints,
            lastUpdated,
        });
    } catch (error) {
        console.error('Error retrieving wallet points:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}