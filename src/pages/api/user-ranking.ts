import type { NextApiRequest, NextApiResponse } from 'next'
import { EnrichedRankingData, RankingData } from '~/components/SectionTwo';
import { db } from '~/server/db'  // Adjust this import path as needed

type SortField = 'tipsReceived' | 'tipsSent' | 'tipsReceivedCount' | 'tipsSentCount'

interface User {
    fid?: number;
    username?: string;
    display_name?: string;
    pfp_url?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { address, sort } = req.query

    if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'Invalid address parameter' })
    }

    try {
        const sortField = sort as SortField
        if (!['tipsReceived', 'tipsSent', 'tipsReceivedCount', 'tipsSentCount'].includes(sortField)) {
            return res.status(400).json({ error: 'Invalid sort parameter' })
        }

        const userRanking = await db.userRankings.findFirst({
            where: {
                user: {
                    walletAddress: {
                        equals: address,
                        mode: 'insensitive'
                    }
                }
            },
            include: {
                user: true
            }
        }) as (RankingData & { user: User }) | null;

        if (!userRanking) {
            return res.status(404).json({ error: 'User ranking not found' })
        }

        const usersAbove = await db.userRankings.count({
            where: {
                [sortField]: {
                    gt: userRanking[sortField],
                },
            },
        })

        const rank = usersAbove + 1

        // Fetch user details
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/neynar-users?fids=${userRanking.fid}`);
        if (!userResponse.ok) {
            throw new Error("Failed to fetch user details");
        }
        const userData: { users: User[] } = await userResponse.json();

        const userDetails: User = {
            fid: userData.users[0]?.fid,
            username: userData.users[0]?.username,
            display_name: userData.users[0]?.display_name,
            pfp_url: userData.users[0]?.pfp_url
        };

        const enrichedRanking: EnrichedRankingData = {
            ...userRanking,
            rank,
            userDetails,
        }

        res.status(200).json(enrichedRanking)
    } catch (error) {
        console.error('Error fetching user ranking:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}