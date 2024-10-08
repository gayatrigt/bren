import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { NeynarUser } from '~/contracts/NeynarUser';
import { env } from '~/env';
import { db } from '~/server/db';

type ApiResponse = {
    message: string;
    updatedCount?: number;
    error?: string;
};

const NEYNAR_API_KEY = env.NEYNAR_API_KEY
const NEYNAR_API_URL = 'https://api.neynar.com/v2/farcaster/user/bulk';

async function fetchAddressesFromNeynar(fids: number[], retryCount = 3): Promise<Map<number, string>> {
    try {
        const fidString = fids.join(',');
        console.log(`Fetching addresses for FIDs: ${fidString}`);
        const response = await fetch(`${NEYNAR_API_URL}?fids=${fidString}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'api_key': NEYNAR_API_KEY!,
            },
        });

        if (!response.ok) {
            console.error(`Neynar API error: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error(`Error body: ${errorBody}`);

            if (retryCount > 0 && (response.status >= 500 || response.status === 429)) {
                console.log(`Retrying... (${retryCount} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
                return fetchAddressesFromNeynar(fids, retryCount - 1);
            }

            throw new Error(`Neynar API error: ${response.statusText}`);
        }

        const data = await response.json() as NeynarUser;
        console.log(`Received data for ${data.users.length} users`);

        const addressMap = new Map<number, string>();
        data.users.forEach(user => {
            const ethAddress = user.verified_addresses.eth_addresses[0];
            if (ethAddress) {
                addressMap.set(user.fid, ethAddress);
            }
        });

        return addressMap;
    } catch (error) {
        console.error('Error in fetchAddressesFromNeynar:', error);
        throw error;
    }
}

async function updateWinnerAddresses(addressMap: Map<number, string>): Promise<number> {
    let updatedCount = 0;

    for (const [fid, address] of addressMap) {
        try {
            const result = await db.winner.updateMany({
                where: { fid, walletAddress: null },
                data: { walletAddress: address },
            });
            updatedCount += result.count;
            console.log(`Updated address for FID ${fid}: ${address}`);
        } catch (error) {
            console.error(`Error updating address for FID ${fid}:`, error);
        }
    }

    return updatedCount;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        console.log('Starting wallet address update process');
        const winnersWithoutAddresses = await db.winner.findMany({
            where: { walletAddress: null },
            select: { fid: true },
        });

        console.log(`Found ${winnersWithoutAddresses.length} winners without addresses`);
        const fids = winnersWithoutAddresses.map(winner => winner.fid);
        let totalUpdatedCount = 0;

        for (let i = 0; i < fids.length; i += 100) {
            const batch = fids.slice(i, i + 100);
            console.log(`Processing batch ${i / 100 + 1} (${batch.length} FIDs)`);
            const addressMap = await fetchAddressesFromNeynar(batch);
            const updatedCount = await updateWinnerAddresses(addressMap);
            totalUpdatedCount += updatedCount;
            console.log(`Batch ${i / 100 + 1} complete. Updated ${updatedCount} addresses.`);
        }

        console.log(`Process complete. Total updated addresses: ${totalUpdatedCount}`);
        res.status(200).json({
            message: 'Wallet addresses updated successfully',
            updatedCount: totalUpdatedCount,
        });
    } catch (error) {
        console.error('Error updating wallet addresses:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
}