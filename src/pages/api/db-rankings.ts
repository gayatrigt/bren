import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '~/server/db'  // Adjust this import path as needed
import { Prisma } from '@prisma/client'

type SortField = 'tipsReceived' | 'tipsSent' | 'tipsReceivedCount' | 'tipsSentCount'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { sort, page, limit } = req.query

    const pageNumber = parseInt(page as string, 10)
    const limitNumber = parseInt(limit as string, 10)

    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
        return res.status(400).json({ error: 'Invalid page or limit parameter' })
    }

    const skip = (pageNumber - 1) * limitNumber

    try {
        const sortField = sort as SortField
        if (!['tipsReceived', 'tipsSent', 'tipsReceivedCount', 'tipsSentCount'].includes(sortField)) {
            return res.status(400).json({ error: 'Invalid sort parameter' })
        }

        const orderBy: Prisma.UserRankingsOrderByWithRelationInput = {
            [sortField]: 'desc'
        }

        const [users, totalCount] = await Promise.all([
            db.userRankings.findMany({
                orderBy,
                skip,
                take: limitNumber,
                include: {
                    user: {
                        select: {
                            fid: true,
                            walletAddress: true,
                            tgUsername: true
                        }
                    }
                }
            }),
            db.userRankings.count(),
        ])

        const totalPages = Math.ceil(totalCount / limitNumber)

        // Transform the data to include fid at the top level
        const transformedUsers = users.map((user, index) => ({
            ...user,
            fid: user.user?.fid,
            walletAddress: user.user.walletAddress,
            tgUsername: user.user.tgUsername,
            rank: skip + index + 1, // Calculate rank based on the current page and index
            user: undefined // Remove the nested user object
        }))

        res.status(200).json({
            data: transformedUsers,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limitNumber,
            },
        })
    } catch (error) {
        console.error('Error fetching rankings:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}