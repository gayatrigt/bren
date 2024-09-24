// pages/api/base-builds/user-stats/[fid].ts

import type { NextApiRequest, NextApiResponse } from 'next';
import NodeCache from 'node-cache';
import { db } from '~/server/db';

const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

interface UserStats {
    fid: number;
    totalAmount: number;
    totalBuildAmount: number | null;
    numberOfRounds: number;
    rank: number;
}

type ApiResponse = UserStats | { error: string };

// Custom serializer to handle BigInt
const bigIntSerializer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};

// Function to safely convert BigInt to number
const safeNumber = (value: any): number => {
    if (typeof value === 'bigint') {
        return Number(value);
    }
    return value;
};

// Type guard function
function isUserStats(obj: any): obj is UserStats {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        (typeof obj.fid === 'number' || typeof obj.fid === 'bigint') &&
        (typeof obj.totalAmount === 'number' || typeof obj.totalAmount === 'bigint') &&
        (obj.totalBuildAmount === null || typeof obj.totalBuildAmount === 'number' || typeof obj.totalBuildAmount === 'bigint') &&
        (typeof obj.numberOfRounds === 'number' || typeof obj.numberOfRounds === 'bigint') &&
        (typeof obj.rank === 'number' || typeof obj.rank === 'bigint')
    );
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { fid } = req.query;
    const fidNumber = Number(fid);

    if (isNaN(fidNumber)) {
        return res.status(400).json({ error: 'Invalid FID provided' });
    }

    try {
        // Check cache first
        const cachedStats = cache.get<UserStats>(`user-stats-${fidNumber}`);
        if (cachedStats) {
            return res.status(200).json(cachedStats);
        }

        // If not in cache, fetch from database
        const userStats = await db.$queryRaw`
      WITH RankedUsers AS (
        SELECT 
          fid,
          amount,
          "amountBuild",
          array_length("roundIds", 1) as number_of_rounds,
          RANK() OVER (ORDER BY amount DESC, fid ASC) as rank
        FROM "Winner"
      )
      SELECT 
        fid,
        amount as "totalAmount",
        "amountBuild" as "totalBuildAmount",
        number_of_rounds as "numberOfRounds",
        rank
      FROM RankedUsers
      WHERE fid = ${fidNumber}
    `;

        console.log('Raw userStats:', JSON.stringify(userStats, bigIntSerializer, 2));

        if (!Array.isArray(userStats) || userStats.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const rawStats = userStats[0];

        if (!isUserStats(rawStats)) {
            console.error('Invalid data structure:', JSON.stringify(rawStats, bigIntSerializer, 2));
            throw new Error('Invalid data structure returned from database');
        }

        const stats: UserStats = {
            fid: safeNumber(rawStats.fid),
            totalAmount: safeNumber(rawStats.totalAmount),
            totalBuildAmount: rawStats.totalBuildAmount !== null ? safeNumber(rawStats.totalBuildAmount) : null,
            numberOfRounds: safeNumber(rawStats.numberOfRounds),
            rank: safeNumber(rawStats.rank)
        };

        // Cache the result
        cache.set(`user-stats-${fidNumber}`, stats);

        return res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await db.$disconnect();
    }
}