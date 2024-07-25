import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "~/server/db";

interface NeynarUserInfo {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
}

async function getUserInfoFromNeynar(address: string): Promise<NeynarUserInfo | null> {
    const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
    const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`;

    try {
        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'api_key': NEYNAR_API_KEY || ''
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from Neynar API');
        }

        const data = await response.json();
        const user = data[address.toLowerCase()]?.[0];

        return user ? {
            fid: user.fid,
            username: user.username,
            displayName: user.display_name,
            pfpUrl: user.pfp_url
        } : null;
    } catch (error) {
        console.error('Error fetching from Neynar API:', error);
        return null;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'Address is required' });
    }

    try {
        const neynarUserInfo = await getUserInfoFromNeynar(address);

        if (!neynarUserInfo) {
            return res.status(404).json({ error: 'User not found in Neynar' });
        }

        const { fid, username, displayName: neynarDisplayName, pfpUrl } = neynarUserInfo;

        // Check User table
        const user = await db.user.findUnique({
            where: { fid },
        });

        // Get user rankings
        const userRanking = await db.userRankings.findUnique({
            where: { fid },
        });

        if (user || userRanking) {
            let invitesCount = 0;
            if (user) {
                // Count invites only if user exists in User table
                invitesCount = await db.invite.count({
                    where: { invitorFid: fid },
                });
            }

            // Calculate total Bren points
            const totalBrenPoints = await db.userRankings.aggregate({
                _sum: {
                    tipsReceived: true
                },
                where: {
                    fid
                }
            });

            res.status(200).json({
                weeklyAllowance: user ? true : false,
                invites: invitesCount,
                brenPoints: totalBrenPoints._sum.tipsReceived || 0,
                name: user?.display_name || neynarDisplayName,
                username: user?.username || username,
                pfpUrl: user?.pfp || pfpUrl,
                fid,
            });
        } else {
            res.status(404).json({ error: 'User not found in any table' });
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
}