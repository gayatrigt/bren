import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { db } from '~/server/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

async function sendTelegramDM(userId: number, text: string) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: userId,
            text: text,
        }),
    });
}

// Updated setWebhook function
export async function setWebhook() {
    console.log(BOT_TOKEN, WEBHOOK_URL)
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: WEBHOOK_URL,
                allowed_updates: ["message", "message_reaction"]
            }),
        });
        const data = await response.json();
        console.log('Webhook set:', data);
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
}


// Helper function to get the current week's start date
function getStartOfWeek(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
}

// Helper function to check if the bot is tagged in the message
function isBotMentioned(text: string): boolean {
    return text.includes('@brenisbot');
}

// Helper function to parse tip amount and recipient
function parseTipMessage(text: string, replyToMessage: any): { amount: number, recipient: string } | null {
    const match = text.match(/(\d+)\s+\$bren/i);
    if (match && match[1]) {
        const amount = parseInt(match[1], 10);
        let recipient = '';

        // If it's a reply, get the recipient from the replied-to message
        if (replyToMessage && replyToMessage.from && replyToMessage.from.username) {
            recipient = replyToMessage.from.username;
        } else {
            // If it's not a reply, try to find a mentioned username
            const mentionMatch = text.match(/@(\w+)/);
            if (mentionMatch && mentionMatch[1]) {
                recipient = mentionMatch[1];
            }
        }

        if (recipient) {
            return { amount, recipient };
        }
    }
    return null;
}

// Main webhook handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const update = req.body;

        console.log("webhook received", update)

        // Acknowledge receipt immediately
        res.status(200).json({ ok: true });

        // Process the message asynchronously
        if (update.message && update.message.text) {
            const message = update.message;
            const fromUser = message.from?.username;
            const fromUserid = message.from?.id
            const messageId = message.message_id.toString();

            console.log(message, fromUser)

            if (isBotMentioned(message.text)) {
                const tipInfo = parseTipMessage(message.text, message.reply_to_message);

                console.log("tip", tipInfo)

                if (fromUser && tipInfo) {
                    processTip(fromUser, fromUserid, message.from?.first_name, message.from?.last_name, tipInfo.recipient, tipInfo.amount, message.message_id.toString(), message.chat.id, message.chat?.title)
                        .catch(error => console.error('Error processing tip:', error));
                } else {
                    console.error('Invalid tip format or missing user information');
                }
            }
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

async function processTip(fromUsername: string, fromUserid: number, first_name: string, last_name: string, toUsername: string, amount: number, messageId: string, chatId: number, chatName: string) {
    console.log("processing tip", toUsername, fromUsername, chatId, amount)
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