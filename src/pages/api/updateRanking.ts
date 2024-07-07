import { Prisma } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db"
import { User, getUserById } from "~/server/neynar";

interface RankingResult {
    fid: number;
    walletAddress: string;
    totalPoints: bigint;
    rank: number;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    try {
        await updateRankings()
        res.status(200).json({ message: 'Rankings updated successfully' })
    } catch (error) {
        console.error('Error updating rankings:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function updateRankings() {
    await db.$transaction(async (tx) => {
        // Clear existing rankings
        await tx.userRanking.deleteMany({});

        // Calculate new rankings and fetch wallet addresses
        const rankings = await tx.$queryRaw<(RankingResult & { walletAddress: string | null })[]>`
    WITH user_points AS (
      SELECT 
        "Transaction"."toFid" as "fid",
        COALESCE(SUM("Transaction"."amount"), 0) as "totalPoints",
        MAX("Transaction"."toAddress") as "walletAddress"
      FROM "Transaction"
      WHERE "Transaction"."toFid" IS NOT NULL
      GROUP BY "Transaction"."toFid"
    ),
    ranked_users AS (
      SELECT 
        "fid",
        "totalPoints",
        "walletAddress",
        RANK() OVER (ORDER BY "totalPoints" DESC) as "rank"
      FROM user_points
    )
    SELECT * FROM ranked_users
  `;

        // Get existing user FIDs
        const existingUsers = await tx.user.findMany({
            select: { fid: true }
        });
        const existingUserFids = new Set(existingUsers.map(u => u.fid));

        // Create new rankings
        for (const r of rankings) {
            // If user doesn't exist, create it first
            if (!existingUserFids.has(r.fid)) {

                const details = await getUserById(r.fid)

                await tx.user.create({
                    data: {
                        fid: r.fid,
                        walletAddress: r.walletAddress,
                        display_name: details?.display_name,
                        username: details?.username,
                        pfp: details?.pfp_url,
                        isAllowanceGiven: false
                    }
                });
            }

            // Now create or update the UserRanking
            await tx.userRanking.upsert({
                where: { fid: r.fid },
                update: {
                    totalPoints: r.totalPoints,
                    rank: Number(r.rank),
                    walletAddress: r.walletAddress
                },
                create: {
                    fid: r.fid,
                    totalPoints: r.totalPoints,
                    rank: Number(r.rank),
                    walletAddress: r.walletAddress
                }
            });
        }
    });

    console.log('Rankings updated successfully');
}