import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { stringify } from 'csv-stringify/sync';
import { env } from '~/env';
import { db } from '~/server/db';

const NEYNAR_API_KEY = env.NEYNAR_API_KEY;
const NEYNAR_API_URL = 'https://api.neynar.com/v2/farcaster/user/bulk';

export interface Root {
    users: NeynarUser[]
}

export interface NeynarUser {
    object: string
    fid: number
    custody_address: string
    username: string
    display_name: string
    pfp_url: string
    profile: Profile
    follower_count: number
    following_count: number
    verifications: string[]
    verified_addresses: VerifiedAddresses
    active_status: string
    power_badge: boolean
}

export interface Profile {
    bio: Bio
}

export interface Bio {
    text: string
}

export interface VerifiedAddresses {
    eth_addresses: string[]
    sol_addresses: any[]
}


type WinnerData = {
    id: string;
    fid: number;
    amount: number;
    amountBuild: number | null;
    walletAddress: string | null;
    username: string;
    warpcastLink: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Fetch all winners from the database
        const winners = await db.winner.findMany();

        // Group FIDs into batches of 100
        const fidBatches = winners.reduce((batches, winner, index) => {
            const batchIndex = Math.floor(index / 100);
            if (!batches[batchIndex]) {
                batches[batchIndex] = [];
            }
            batches[batchIndex].push(winner.fid);
            return batches;
        }, [] as number[][]);

        // Fetch usernames from Neynar API
        const usernameMap = new Map<number, string>();
        for (const batch of fidBatches) {
            const response = await fetch(`${NEYNAR_API_URL}?fids=${batch.join(',')}`, {
                headers: {
                    'accept': 'application/json',
                    'api_key': NEYNAR_API_KEY!
                }
            });

            if (!response.ok) {
                throw new Error(`Neynar API error: ${response.statusText}`);
            }

            const data = await response.json() as Root;
            data.users.forEach((user: NeynarUser) => {
                usernameMap.set(user.fid, user.username);
            });
        }

        // Prepare data for CSV
        const winnerData: WinnerData[] = winners.map(winner => {
            const username = usernameMap.get(winner.fid) || '';
            return {
                id: winner.id,
                fid: winner.fid,
                amount: winner.amount,
                amountBuild: winner.amountBuild,
                walletAddress: winner.walletAddress,
                username: username,
                warpcastLink: username ? `https://warpcast.com/${username}` : ''
            };
        });

        // Generate CSV
        const csv = stringify(winnerData, {
            header: true,
            columns: ['id', 'fid', 'amount', 'amountBuild', 'walletAddress', 'username', 'warpcastLink']
        });

        // Set response headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=winner_data.csv');

        // Send the CSV as the response
        res.status(200).send(csv);
    } catch (error) {
        console.error('Error processing winner data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    } finally {
        await db.$disconnect();
    }
}