import { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'json2csv'
import { Decimal } from 'decimal.js'
import { db } from '~/server/db'

// Set precision for decimal calculations
Decimal.set({ precision: 18 })

const TOTAL_ETH_TO_DISTRIBUTE = new Decimal('0.22')
const EXCLUDED_FIDS = new Set([469678, 479, 190081])

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    try {
        // Fetch all rows from UserRankings table
        const userRankings = await db.userRankings.findMany()

        // Calculate total points and prepare data for ETH distribution
        let totalPoints = new Decimal(0)
        const enrichedUserRankings = userRankings.map(user => {
            const tipsReceived = new Decimal(user.tipsReceived ?? 0)
            const tipsSent = new Decimal(user.tipsSent ?? 0)
            const points = tipsReceived.plus(tipsSent)

            // Only add to total points if not in excluded FIDs
            if (!EXCLUDED_FIDS.has(user.fid)) {
                totalPoints = totalPoints.plus(points)
            }

            return { ...user, totalPoints: points }
        })

        // Calculate ETH share for each user
        const finalUserRankings = enrichedUserRankings.map(user => {
            let ethShare = new Decimal(0)

            // Only calculate ETH share if not in excluded FIDs
            if (!EXCLUDED_FIDS.has(user.fid)) {
                ethShare = user.totalPoints.div(totalPoints).times(TOTAL_ETH_TO_DISTRIBUTE)
            }

            return {
                ...user,
                tipsReceived: user.tipsReceived ?? 0,
                tipsSent: user.tipsSent ?? 0,
                ethShare: ethShare.toFixed(18) // 18 decimal places for ETH
            }
        })

        // Convert data to CSV
        const csv = parse(finalUserRankings)

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=user-rankings-with-eth.csv')

        // Send the CSV data
        res.status(200).send(csv)
    } catch (error) {
        console.error('Error fetching user rankings:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    } finally {
        await db.$disconnect()
    }
}