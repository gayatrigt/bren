// pages/api/collect-fids.ts
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
        const roundsResponse = await fetch(roundsUrl);
        if (!roundsResponse.ok) {
            throw new Error(`HTTP error! status: ${roundsResponse.status}`);
        }
        const roundsData: RoundsResponse = await roundsResponse.json();

        // Step 2: Extract round IDs
        const roundIds = roundsData.rounds.map(round => round.id);

        // Step 3 & 4: Fetch winner data for each round and collect FIDs
        const allFids = new Set<number>();
        for (const roundId of roundIds) {
            const winnersUrl = `https://rounds.wtf/api/public/v1/rounds/${roundId}/winners`;
            const winnersResponse = await fetch(winnersUrl);
            if (!winnersResponse.ok) {
                throw new Error(`HTTP error! status: ${winnersResponse.status}`);
            }
            const winnersData: WinnersResponse = await winnersResponse.json();
            const roundFids = winnersData.winners.map(winner => winner.fid);
            roundFids.forEach(fid => allFids.add(fid));
        }

        // Step 5: Remove duplicates (already done by using a Set)

        // Step 6: Return JSON response with unique FIDs
        res.status(200).json({ fids: Array.from(allFids) });
    } catch (error) {
        console.error('Error collecting FIDs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}