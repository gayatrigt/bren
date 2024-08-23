// pages/api/processTip.ts

import { PrismaClient } from '@prisma/client';
import { db } from '~/server/db';
import { getStartOfWeek, sendTelegramDM } from './telegramWebhook';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function processTip(
    fromUsername: string,
    fromUserid: number,
    first_name: string,
    last_name: string,
    toUsername: string,
    amount: number,
    messageId: string,
    chatId: number,
    chatName: string
) {
    console.log("processing tip", toUsername, fromUsername, chatId, amount);
    const fromUser = await db.userTG.findUnique({ where: { username: fromUsername } });
    const toUser = await db.userTG.findUnique({ where: { username: toUsername } });

    if (!fromUser) {
        await db.userTG.create({
            data: {
                username: fromUsername,
                idTG: fromUserid,
                first_name,
                last_name,
                isAllowanceGiven: true,
                allowanceGivenAt: new Date(),
            },
        });
    }

    if (!toUser) {
        await db.userTG.create({
            data: {
                username: toUsername,
                isAllowanceGiven: false,
            },
        });
    }

    const startOfWeek = getStartOfWeek();
    const tipsSentThisWeek = await db.transactionTG.aggregate({
        where: {
            fromUsername,
            createdAt: { gte: startOfWeek },
        },
        _sum: { amount: true },
    });

    const remainingAllowance = 500 - (tipsSentThisWeek._sum.amount || 0);

    if (amount <= remainingAllowance) {
        await db.transactionTG.create({
            data: {
                messageid: messageId,
                fromUsername,
                groupid: chatId,
                groupname: chatName,
                toUsername,
                text: `${amount} $bren to @${toUsername}`,
                amount,
                value: amount.toString(),
            },
        });

        await db.userRankingsTG.upsert({
            where: { username: fromUsername },
            update: {
                tipsSent: { increment: amount },
                tipsSentCount: { increment: 1 },
                lastUpdated: new Date(),
            },
            create: {
                username: fromUsername,
                tipsSent: amount,
                tipsSentCount: 1,
                lastUpdated: new Date(),
            },
        });

        await db.userRankingsTG.upsert({
            where: { username: toUsername },
            update: {
                tipsReceived: { increment: amount },
                tipsReceivedCount: { increment: 1 },
                lastUpdated: new Date(),
            },
            create: {
                username: toUsername,
                tipsReceived: amount,
                tipsReceivedCount: 1,
                lastUpdated: new Date(),
            },
        });

        // Send thumbs up reaction
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMessageReaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                reaction: [{ type: 'emoji', emoji: '👍' }],
                is_big: false
            }),
        });

        console.log(`Tip processed: ${amount} $bren from @${fromUsername} to @${toUsername}`);

        const text = `Thank you for using Bren! Please connect your wallet so your points can be on-chain!`;
        await sendTelegramDM(fromUserid, text);

    } else {
        console.log(`Tip failed: Insufficient allowance for @${fromUsername}`);
        // Optionally, send a message to the user about insufficient allowance
    }
}