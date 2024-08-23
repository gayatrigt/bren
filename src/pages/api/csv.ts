import { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'json2csv'
import { Decimal } from 'decimal.js'
import { db } from '~/server/db'

// Set precision for decimal calculations
Decimal.set({ precision: 18 })

const TOTAL_ETH_TO_DISTRIBUTE = new Decimal('0.22')
const EXCLUDED_FIDS = new Set([469678, 479, 190081])

// Conversion rates
const ETH_TO_USD_RATE = new Decimal('2651.54')
const ETH_TO_BUILD_RATE = new Decimal('1062170000')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    try {
        // 1. Fetch transactions from 5th to 11th August
        const startDate = new Date('2024-08-05T00:00:00Z')
        const endDate = new Date('2024-08-11T23:59:59Z')

        const transactions = await db.transaction.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                fromAddress: true,
                toAddress: true
            }
        })

        console.log(`Transactions found: ${transactions.length}`)

        // Check if there are any transactions
        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found for the specified date range' })
        }

        // 2. Get unique addresses involved in transactions
        const uniqueAddresses = new Set<string>()
        transactions.forEach(tx => {
            uniqueAddresses.add(tx.fromAddress)
            if (tx.toAddress) uniqueAddresses.add(tx.toAddress)
        })

        console.log(`Unique addresses found: ${uniqueAddresses.size}`)

        // 3. Fetch user rankings for only the addresses involved in transactions
        const userRankings = await db.userRankings.findMany({
            where: {
                walletAddress: {
                    in: Array.from(uniqueAddresses)
                }
            }
        })

        console.log(`User rankings found: ${userRankings.length}`)

        // If no user rankings found, return an appropriate message
        if (userRankings.length === 0) {
            return res.status(404).json({ message: 'No user rankings found for the addresses involved in transactions' })
        }

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

            return { ...user, totalPoints: points.toNumber() }
        })

        // Calculate ETH share for each user and convert to USD and BUILD
        const finalUserRankings = enrichedUserRankings.map(user => {
            let ethShare = new Decimal(0)

            // Only calculate ETH share if not in excluded FIDs
            if (!EXCLUDED_FIDS.has(user.fid)) {
                ethShare = user.totalPoints ? new Decimal(user.totalPoints).div(totalPoints).times(TOTAL_ETH_TO_DISTRIBUTE) : new Decimal(0)
            }

            const usdShare = ethShare.times(ETH_TO_USD_RATE)
            const buildShare = ethShare.times(ETH_TO_BUILD_RATE)

            return {
                fid: user.fid,
                walletAddress: user.walletAddress,
                tipsReceived: user.tipsReceived ?? 0,
                tipsSent: user.tipsSent ?? 0,
                tipsReceivedCount: user.tipsReceivedCount ?? 0,
                tipsSentCount: user.tipsSentCount ?? 0,
                totalPoints: user.totalPoints,
                ethShare: ethShare.toFixed(18), // 18 decimal places for ETH
                usdShare: usdShare.toFixed(2),  // 2 decimal places for USD
                buildShare: buildShare.toFixed(0) // 0 decimal places for BUILD (whole numbers)
            }
        })

        // Define fields for CSV
        const fields = ['fid', 'walletAddress', 'tipsReceived', 'tipsSent', 'tipsReceivedCount', 'tipsSentCount', 'totalPoints', 'ethShare', 'usdShare', 'buildShare']

        // Convert data to CSV
        const csv = parse(finalUserRankings, { fields })

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=user-rankings-with-eth-usd-build.csv')

        // Send the CSV data
        res.status(200).send(csv)
    } catch (error) {
        console.error('Error fetching user rankings:', error)
        res.status(500).json({ message: 'Internal Server Error', error: error })
    } finally {
        await db.$disconnect()
    }
}