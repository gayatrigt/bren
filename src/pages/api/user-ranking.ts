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

        let user = await db.user.findUnique({
            where: {
                walletAddress: address
            },
            include: {
                userRankings: true,
                farcasterDetails: true
            }
        });

        // If not found, try case-insensitive search
        if (!user) {
            user = await db.user.findFirst({
                where: {
                    walletAddress: {
                        equals: address,
                        mode: 'insensitive'
                    }
                },
                include: {
                    userRankings: true,
                    farcasterDetails: true
                }
            });
        }

        if (!user || !user.userRankings) {
            return res.status(404).json({ error: 'User or user ranking not found' })
        }

        const userRanking = user.userRankings;

        const usersAbove = await db.userRankings.count({
            where: {
                [sortField]: {
                    gt: userRanking[sortField],
                },
            },
        })

        const rank = usersAbove + 1

        let userDetails: User;

        if (user.farcasterDetails && user.farcasterDetails.fid) {
            userDetails = {
                fid: user.farcasterDetails.fid,
                username: user.farcasterDetails.username || undefined,
                display_name: user.farcasterDetails.display_name || undefined,
                pfp_url: user.farcasterDetails.pfp || undefined
            };
        } else {
            // Fetch user details from Neynar
            const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/neynar-users?fids=${user.fid}`);
            if (!userResponse.ok) {
                throw new Error("Failed to fetch user details from Neynar");
            }
            const userData: { users: User[] } = await userResponse.json();

            userDetails = {
                fid: userData.users[0]?.fid,
                username: userData.users[0]?.username,
                display_name: userData.users[0]?.display_name,
                pfp_url: userData.users[0]?.pfp_url
            };

            // Upsert FarcasterDetails
            await db.farcasterDetails.upsert({
                where: { userId: user.id },
                update: {
                    fid: userDetails.fid,
                    username: userDetails.username,
                    display_name: userDetails.display_name,
                    pfp: userDetails.pfp_url
                },
                create: {
                    userId: user.id,
                    fid: userDetails.fid,
                    username: userDetails.username,
                    display_name: userDetails.display_name,
                    pfp: userDetails.pfp_url
                }
            });
        }

        const enrichedRanking: EnrichedRankingData = {
            ...userRanking,
            fid: user.fid || undefined,
            walletAddress: user.walletAddress || '',
            rank,
            userDetails,
        }

        res.status(200).json(enrichedRanking)
    } catch (error) {
        console.error('Error fetching user ranking:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}