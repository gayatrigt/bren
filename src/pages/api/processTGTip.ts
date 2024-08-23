// pages/api/process-tip.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { db } from '~/server/db';
import { getStartOfWeek, sendTelegramDM } from './telegramWebhook';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_SECRET = process.env.API_SECRET; // Add this to your environment variables

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        fromUsername,
        fromUserid,
        first_name,
        last_name,
        toUsername,
        amount,
        messageId,
        chatId,
        chatName
    } = req.body;

    if (!fromUsername || !fromUserid || !toUsername || !amount || !messageId || !chatId || !chatName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        console.log("Processing tip:", { fromUsername, toUsername, amount, chatId });

        const fromUser = await db.userTG.findUnique({ where: { username: fromUsername } });
        const toUser = await db.userTG.findUnique({ where: { username: toUsername } });

        if (!fromUser) {
            console.log("Creating new fromUser:", fromUsername);
            await db.userTG.create({
                data: {
                    username: fromUsername,
                    idTG: fromUserid,
                    first_name,
                    last_name: last_name || '',
                    isAllowanceGiven: true,
                    allowanceGivenAt: new Date(),
                },
            });
        }

        if (!toUser) {
            console.log("Creating new toUser:", toUsername);
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
        console.log("Remaining allowance:", remainingAllowance);

        if (amount <= remainingAllowance) {
            console.log("Processing transaction...");
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

            console.log("Updating user rankings...");
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

            console.log("Sending reaction...");
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

            res.status(200).json({ message: 'Tip processed successfully' });
        } else {
            console.log(`Tip failed: Insufficient allowance for @${fromUsername}`);
            res.status(400).json({ error: 'Insufficient allowance' });
        }
    } catch (error) {
        console.error("Error in processTip:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}