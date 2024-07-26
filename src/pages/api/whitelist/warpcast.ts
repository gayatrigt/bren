// pages/api/collect-fids.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { warpcastUrls, warpcastUrlsnew } from './urls';
import fetch from 'node-fetch';
import { env } from '~/env';

type ApiResponse = {
    fids: Record<string, number>;
} | {
    message: string;
}

// type NeynarApiResponse = {
//     data: {
//         id: number;
//         username: string;
//     }[];
// }

export interface NeynarApiResponse {
    result: Result
}

export interface Result {
    users: User[]
    next: Next
}

export interface User {
    object: string
    fid: number
    custody_address: string
    username: string
    display_name: string
    pfp_url: string
    profile: Profile
    follower_count: number
    following_count: number
    verifications: any[]
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
    eth_addresses: any[]
    sol_addresses: any[]
}

export interface Next {
    cursor: string
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const fids: Record<string, number> = {};

        for await (const [username, url] of Object.entries(warpcastUrlsnew)) {
            const apiUrl = `https://api.neynar.com/v2/farcaster/user/search?q=${username}&limit=1`;
            const options = {
                method: 'GET',
                headers: { accept: 'application/json', api_key: env.NEYNAR_API_KEY }
            };

            const response = await fetch(apiUrl, options);

            if (!response.ok) {
                console.error(`Failed to fetch data for ${username}: ${response.statusText}`);
                continue;
            }

            const data = await response.json() as unknown as NeynarApiResponse;
            console.log("🚀 ~ forawait ~ data:", JSON.stringify(data))

            const user = data.result.users[0]

            if (user) {
                const fid = user.fid;
                fids[username] = fid;
            }
        }

        res.status(200).json({ fids });
    } catch (error) {
        console.error('Error collecting FIDs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
