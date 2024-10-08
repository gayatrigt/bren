import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from "~/server/db";
import { Platform } from "@prisma/client";
import { getWeekStart } from "../user-event";
import { botReplySuccess, bottip } from "../functions/botReply";

type ApiResponse = {
    success: boolean;
    message: string;
    transactionId?: string;
    replycastHash?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const {
        tipAmount,
        fromFid,
        fromAddress,
        fromUsername,
        toFid,
        toAddress,
        toUsername,
        message,
        hashtagValue,
        txHash,
    } = req.body;

    try {
        // Generate castHash by appending toFid to txHash
        const castHash = `${txHash}${toFid}`;

        const result = await processTip(
            tipAmount,
            fromFid,
            fromAddress,
            fromUsername,
            toFid,
            toAddress,
            toUsername,
            message,
            hashtagValue,
            castHash
        );

        res.status(200).json({
            success: true,
            message: 'Tip processed successfully',
            transactionId: result.transactionId,
            replycastHash: result.replycastHash
        });
    } catch (error) {
        console.error('Error processing tip:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing tip',
        });
    }
}

async function processTip(
    tipAmount: number,
    fromFid: number,
    fromAddress: string,
    fromUsername: string,
    toFid: number,
    toAddress: string,
    toUsername: string,
    message: string,
    hashtagValue: string,
    castHash: string,
): Promise<{ transactionId: string, replycastHash: string }> {
    // Find or create the users
    const [fromUser, toUser] = await Promise.all([
        findOrCreateUser(fromFid, fromAddress, fromUsername),
        findOrCreateUser(toFid, toAddress, toUsername)
    ]);

    const data = {
        amount: tipAmount,
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        text: message,
        value: hashtagValue,
        castHash,
        parentCastHash: null,
        link: `https://warpcast.com/`,
        platform: Platform.FARCASTER
    };

    const createdTransaction = await db.transaction.create({ data });

    // Record the point event
    await db.pointEvent.create({
        data: {
            userId: toUser.id,
            event: "FARCASTER_TIP",
            points: tipAmount,
            platform: "FARCASTER",
        },
    });

    // Update weekly points
    const weekStart = getWeekStart();
    await db.weeklyPoints.upsert({
        where: {
            userId_weekStart_platform: {
                userId: fromUser.id,
                weekStart,
                platform: "FARCASTER",
            },
        },
        update: {
            pointsEarned: { increment: tipAmount },
        },
        create: {
            userId: fromUser.id,
            weekStart,
            pointsEarned: tipAmount,
            platform: "FARCASTER",
        },
    });

    await updateUserRankings(fromUser.id, tipAmount, false);
    await updateUserRankings(toUser.id, tipAmount, true);

    const allowanceLeft = 1000; // You might want to calculate this dynamically
    const replyResult = await bottip(
        `Hey @${toUsername}!\nYou have successfully received ${tipAmount} $bren for being a base-builds winner!`,
        toFid,
    );

    if (!replyResult.success) {
        console.error('Failed to post reply:', replyResult.message);
    }

    return {
        transactionId: createdTransaction.id,
        replycastHash: replyResult.castHash || ''
    };
}

async function findOrCreateUser(fid: number, walletAddress: string, username: string) {
    let user = await db.user.findFirst({
        where: {
            OR: [
                { fid },
                { walletAddress }
            ]
        },
        include: {
            farcasterDetails: true
        }
    });

    if (!user) {
        user = await db.user.create({
            data: {
                fid,
                walletAddress,
                farcasterDetails: {
                    create: {
                        fid,
                        username
                    }
                }
            },
            include: {
                farcasterDetails: true
            }
        });
    }

    return user;
}

async function updateUserRankings(userId: string, amount: number, isReceived: boolean) {
    await db.userRankings.upsert({
        where: { userId: userId },
        update: {
            [isReceived ? 'tipsReceived' : 'tipsSent']: { increment: amount },
            [isReceived ? 'tipsReceivedCount' : 'tipsSentCount']: { increment: 1 }
        },
        create: {
            userId: userId,
            [isReceived ? 'tipsReceived' : 'tipsSent']: amount,
            [isReceived ? 'tipsReceivedCount' : 'tipsSentCount']: 1
        }
    });
}