// pages/api/rankings.ts
import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function getUserProfile(username: string) {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: `@${username}`,
        }),
    });

    if (!response.ok) {
        console.error(`Failed to get user profile for @${username}: ${response.statusText}`);
        return null;
    }

    const data = await response.json();
    return data.result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { sort = 'tipsReceived', page = '1', limit = '20' } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    try {
        const rankings = await prisma.userRankings.findMany({
            select: {
                id: true,
                userId: true,
                tipsReceived: true,
                tipsSent: true,
                tipsReceivedCount: true,
                tipsSentCount: true,
                user: {
                    select: {
                        walletAddress: true,
                        fid: true,
                        tgUsername: true,
                        farcasterDetails: {
                            select: {
                                username: true,
                                display_name: true,
                                pfp: true,
                            },
                        },
                        telegramDetails: {
                            select: {
                                display_name: true,
                                pfp: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                [sort as string]: 'desc',
            },
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
        });

        // Fetch Telegram details for users without Farcaster details
        const updatedRankings = await Promise.all(rankings.map(async (ranking) => {
            if (!ranking.user.farcasterDetails && ranking.user.tgUsername && !ranking.user.telegramDetails) {
                const tgProfile = await getUserProfile(ranking.user.tgUsername);
                if (tgProfile) {
                    const tgInfo = {
                        display_name: tgProfile.first_name + (tgProfile.last_name ? ` ${tgProfile.last_name}` : ''),
                        pfp: tgProfile.photo?.big_file_id ? `https://api.telegram.org/file/bot${BOT_TOKEN}/${tgProfile.photo.big_file_id}` : null,
                    };
                    await prisma.telegramDetails.upsert({
                        where: { userId: ranking.userId },
                        update: tgInfo,
                        create: {
                            ...tgInfo,
                            userId: ranking.userId,
                        },
                    });
                    ranking.user.telegramDetails = tgInfo;
                }
            }
            return ranking;
        }));

        const total = await prisma.userRankings.count();

        res.status(200).json({
            data: updatedRankings,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalItems: total,
                itemsPerPage: limitNumber,
            },
        });
    } catch (error) {
        console.error('Failed to fetch rankings:', error);
        res.status(500).json({ error: 'Failed to fetch rankings' });
    }
}