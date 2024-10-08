import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { db } from '~/server/db';

// Define the Event enum as a const object
const Event = {
    CREATED_ACCOUNT: "CREATED_ACCOUNT",
    SET_UP_PROFILE: "SET_UP_PROFILE",
    COMPLETED_KYC: "COMPLETED_KYC",
    ADDED_PROJECT: "ADDED_PROJECT",
    FARCASTER_TIP: "FARCASTER_TIP",
    TELEGRAM_TIP: "TELEGRAM_TIP"
} as const;

// Define the Platform enum as a const object
const Platform = {
    ONBOARD: "ONBOARD",
    BLOCASSET: "BLOCASSET",
} as const;

type EventType = typeof Event[keyof typeof Event];
type PlatformType = typeof Platform[keyof typeof Platform];

// Point values for each event (adjust as needed)
const EVENT_POINTS: { [key in EventType]: number } = {
    [Event.CREATED_ACCOUNT]: 10,
    [Event.SET_UP_PROFILE]: 20,
    [Event.COMPLETED_KYC]: 30,
    [Event.ADDED_PROJECT]: 40,
    [Event.FARCASTER_TIP]: 10,
    [Event.TELEGRAM_TIP]: 10
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = req.headers['x-api-key'] as string;
    const apiSecret = req.headers['x-api-secret'] as string;

    console.log('API Key:', apiKey);
    console.log('API Secret:', apiSecret ? '******' : 'undefined');

    const isValid = await validateApiKeyAndSecret(apiKey);
    if (!isValid) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { walletAddress, event, platform, additionalData } = req.body;

    console.log('Extracted fields:');
    console.log('walletAddress:', walletAddress);
    console.log('event:', event);
    console.log('platform:', platform);
    console.log('additionalData:', additionalData);

    // Validate request body
    if (!walletAddress || !event || !platform) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate event
    if (!Object.values(Event).includes(event as EventType)) {
        return res.status(400).json({ error: 'Invalid event' });
    }

    // Validate platform
    if (!Object.values(Platform).includes(platform as PlatformType)) {
        return res.status(400).json({ error: 'Invalid platform' });
    }

    console.log('herrrrrrrrrherrrrrrrrrherrrrrrrrrherrrrrrrrrherrrrrrrrrherrrrrrrrr')

    try {
        // Find or create user
        let user = await db.user.findUnique({ where: { walletAddress } });
        console.log("🚀 ~ handler ~ user:", user)

        if (!user) {
            console.log('herrrrrrrrrherrrrrrrrrherrrrrrrrrherrrrrrrrrherrrrrrrrrherrrrrrrrr')
            user = await db.user.create({
                data: {
                    walletAddress,
                    name: additionalData?.name,
                    email: additionalData?.email,
                },
            });
        }

        // Calculate points earned
        const pointsEarned = EVENT_POINTS[event as EventType];

        // Record the point event
        await db.pointEvent.create({
            data: {
                userId: user.id,
                event: event as EventType,
                points: pointsEarned,
                platform: platform as PlatformType,
            },
        });

        // Update weekly points
        const weekStart = getWeekStart();
        await db.weeklyPoints.upsert({
            where: {
                userId_weekStart_platform: {
                    userId: user.id,
                    weekStart,
                    platform: platform as PlatformType,
                },
            },
            update: {
                pointsEarned: { increment: pointsEarned },
            },
            create: {
                userId: user.id,
                weekStart,
                pointsEarned,
                platform: platform as PlatformType,
            },
        });

        // Update UserRankings
        await db.userRankings.upsert({
            where: { userId: user.id },
            update: {
                tipsReceived: { increment: pointsEarned },
            },
            create: {
                userId: user.id,
                tipsReceived: pointsEarned
            },
        });

        // Calculate total points
        const totalPoints = await db.pointEvent.aggregate({
            where: { userId: user.id },
            _sum: { points: true },
        });

        // Get updated UserRankings
        const userRankings = await db.userRankings.findUnique({
            where: { userId: user.id },
        });

        return res.status(200).json({
            userId: user.id,
            wallet: user.walletAddress,
            pointsEarned,
            totalPoints: totalPoints._sum.points || 0,
            message: 'Event processed successfully',
        });
    } catch (error) {
        console.error('Error processing user event:', error);
        return res.status(500).json({ error: 'Internal server error', details: error });
    } finally {
        await db.$disconnect();
    }
}

async function validateApiKeyAndSecret(apiKey: string): Promise<boolean> {
    const credential = await db.apiCredential.findUnique({
        where: { apiKey },
    });

    if (!credential || !credential.isActive) {
        return false;
    }

    return true;
}

export function getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diff = now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
}