import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import { roundsfids } from './roundsfids';
import { env } from '~/env';

type ApiResponse = {
    usernames: string[];
} | {
    message: string;
    error?: string;
}

// Define the structure of the Neynar API response
type NeynarApiResponse = {
    users: {
        username: string;
        // Add other fields if needed
    }[];
}

const BATCH_SIZE = 100 // Number of FIDs to send in each API call

async function fetchUsernames(fids: number[]): Promise<string[]> {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'api_key': env.NEYNAR_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as NeynarApiResponse;
    return data.users.map(user => user.username);
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Use the roundsfids array directly
        const fids = roundsfids;

        // Fetch usernames in batches
        const usernames: string[] = [];
        for (let i = 0; i < fids.length; i += BATCH_SIZE) {
            const batch = fids.slice(i, i + BATCH_SIZE);
            const batchUsernames = await fetchUsernames(batch);
            usernames.push(...batchUsernames);
        }

        res.status(200).json({ usernames });
    } catch (error) {
        console.error('Error fetching usernames:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
}