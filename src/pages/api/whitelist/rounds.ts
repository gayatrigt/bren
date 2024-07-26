import type { NextApiRequest, NextApiResponse } from 'next'

type Round = {
    id: number;
    // Add other properties as needed
}

type Winner = {
    fid: number;
    // Add other properties as needed
}

type RoundsResponse = {
    rounds: Round[];
}

type WinnersResponse = {
    winners: Winner[];
}

type ApiResponse = {
    fids: number[];
} | {
    message: string;
    error?: string;
}

const TIMEOUT = 10000; // 10 seconds timeout

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Step 1: Fetch rounds data
        const roundsUrl = "https://rounds.wtf/api/public/v1/rounds?communityId=23";
        const roundsResponse = await fetchWithTimeout(roundsUrl);
        const roundsData: RoundsResponse = await roundsResponse.json();

        // Step 2: Extract round IDs
        const roundIds = roundsData.rounds.map(round => round.id);

        // Step 3 & 4: Fetch winner data for each round and collect FIDs
        const allFids = new Set<number>();
        for (const roundId of roundIds) {
            const winnersUrl = `https://rounds.wtf/api/public/v1/rounds/${roundId}/winners`;
            try {
                const winnersResponse = await fetchWithTimeout(winnersUrl);
                const winnersData: WinnersResponse = await winnersResponse.json();
                const roundFids = winnersData.winners.map(winner => winner.fid);
                roundFids.forEach(fid => allFids.add(fid));
            } catch (error) {
                console.error(`Error fetching winners for round ${roundId}:`, error);
                // Continue with the next round instead of breaking the entire process
            }
        }

        // Step 5: Remove duplicates (already done by using a Set)

        // Step 6: Return JSON response with unique FIDs
        res.status(200).json({ fids: Array.from(allFids) });
    } catch (error) {
        console.error('Error collecting FIDs:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
}