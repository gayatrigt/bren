import { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db"

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
        await tx.userRanking.deleteMany({})

        // Calculate new rankings
        const rankings = await tx.$queryRaw<RankingResult[]>`
    WITH user_points AS (
      SELECT 
        COALESCE("User"."fid", 0) as "fid",
        "Transaction"."toAddress" as "walletAddress",
        COALESCE(SUM("Transaction"."amount"), 0) as "totalPoints"
      FROM "Transaction"
      LEFT JOIN "User" ON "User"."walletAddress" = "Transaction"."toAddress"
      GROUP BY COALESCE("User"."fid", 0), "Transaction"."toAddress"
    ),
    ranked_users AS (
      SELECT 
        "fid",
        "walletAddress",
        "totalPoints",
        RANK() OVER (ORDER BY "totalPoints" DESC) as "rank"
      FROM user_points
    )
    SELECT * FROM ranked_users
  `

        await tx.userRanking.createMany({
            data: rankings.map((r) => ({
                fid: r.fid,
                walletAddress: r.walletAddress,
                totalPoints: r.totalPoints,
                rank: Number(r.rank) // Convert BigInt to Number
            })),
        })
    })

    console.log('Rankings updated successfully')
}