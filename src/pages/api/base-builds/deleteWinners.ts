import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '~/server/db'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    try {
        const deletedCount = await db.winner.deleteMany()
        res.status(200).json({ message: `Deleted ${deletedCount.count} winners` })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting winners', error: String(error) })
    } finally {
        await db.$disconnect()
    }
}