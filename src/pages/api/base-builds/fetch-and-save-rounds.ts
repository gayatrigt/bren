// pages/api/base-builds/fetch-and-save-rounds.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '~/server/db';

type ApiResponse = {
    message: string;
    error?: string;
};

const TIMEOUT = 10000; // 10 seconds timeout

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
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

async function fetchWinners(roundId: number) {
    console.log(`Fetching winners for round ${roundId}...`);
    const winnersUrl = `https://rounds.wtf/api/public/v1/rounds/${roundId}/winners`;
    const winnersResponse = await fetchWithTimeout(winnersUrl);
    const winnersData = await winnersResponse.json();
    console.log(`Fetched ${winnersData.winners.length} winners for round ${roundId}.`);
    return { roundId, winners: winnersData.winners };
}

async function processWinners(roundId: number, winners: any[]) {
    for (const winner of winners) {
        if (!winner.fid) {
            console.log(`Skipping winner ${winner.id} for round ${roundId} due to missing fid.`);
            continue;
        }

        const parsedAmount = parseFloat(winner.amount);
        let amount = 0;
        let amountBuild = null;

        if (winner.amount.charAt(0) !== '0') {
            amountBuild = parsedAmount;
        } else {
            amount = parsedAmount;
        }

        const existingWinner = await db.winner.findUnique({
            where: { id: winner.id },
            include: { rounds: true },
        });

        if (existingWinner) {
            if (!existingWinner.rounds.some(r => r.id === roundId)) {
                await db.winner.update({
                    where: { id: winner.id },
                    data: {
                        amount: existingWinner.amount + amount,
                        amountBuild: amountBuild !== null ? (existingWinner.amountBuild || 0) + amountBuild : existingWinner.amountBuild,
                        rounds: { connect: { id: roundId } },
                        roundIds: [...existingWinner.roundIds, roundId],
                    },
                });
                console.log(`Updated winner ${winner.id} (fid: ${winner.fid}) for round ${roundId}. Amount: ${amount}, AmountBuild: ${amountBuild}`);
            } else {
                console.log(`Winner ${winner.id} (fid: ${winner.fid}) already exists for round ${roundId}, skipping...`);
            }
        } else {
            await db.winner.create({
                data: {
                    id: winner.id,
                    fid: winner.fid,
                    amount: amount,
                    amountBuild: amountBuild,
                    rounds: { connect: { id: roundId } },
                    roundIds: [roundId],
                },
            });
            console.log(`Added new winner ${winner.id} (fid: ${winner.fid}) for round ${roundId}. Amount: ${amount}, AmountBuild: ${amountBuild}`);
        }
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
        console.log('Fetching rounds data...');
        const roundsUrl = "https://rounds.wtf/api/public/v1/rounds?communityId=23";
        const roundsResponse = await fetchWithTimeout(roundsUrl);
        const roundsData = await roundsResponse.json();
        console.log(`Fetched ${roundsData.rounds.length} rounds.`);

        const startDate = new Date('2024-10-03T00:00:00.000Z');
        const endDate = new Date('2024-10-07T23:59:59.999Z');

        const roundsToProcess = [];

        for (const round of roundsData.rounds) {
            const votingEndsAt = new Date(round.votingEndsAt);

            if (votingEndsAt >= startDate && votingEndsAt <= endDate) {
                const existingRound = await db.round.findUnique({
                    where: { id: round.id },
                });

                if (existingRound) {
                    console.log(`Round ${round.id} already exists, will check for new winners...`);
                    roundsToProcess.push(round.id);
                } else {
                    await db.round.create({
                        data: {
                            id: round.id,
                            name: round.name,
                            startsAt: new Date(round.startsAt),
                            votingEndsAt: new Date(round.votingEndsAt),
                        },
                    });
                    console.log(`Added new round ${round.id}.`);
                    roundsToProcess.push(round.id);
                }
            } else {
                console.log(`Skipping round ${round.id} as it's outside the specified date range.`);
            }
        }

        console.log(`Processing ${roundsToProcess.length} rounds within the specified date range.`);

        if (roundsToProcess.length > 0) {
            console.log('Fetching winners for filtered rounds in parallel...');
            const winnersData = await Promise.all(roundsToProcess.map(fetchWinners));

            console.log('Processing winners...');
            await Promise.all(winnersData.map(({ roundId, winners }) => processWinners(roundId, winners)));

            console.log('Data fetching and saving completed successfully.');
            res.status(200).json({ message: `Data fetched and saved successfully for ${roundsToProcess.length} rounds.` });
        } else {
            console.log('No rounds found within the specified date range.');
            res.status(200).json({ message: 'No rounds found within the specified date range.' });
        }
    } catch (error) {
        console.error('Error fetching and saving data:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error instanceof Error ? error.message : String(error),
        });
    } finally {
        await db.$disconnect();
    }
}