import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { db } from '~/server/db';
import { processTip } from './processTGTip';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

export async function sendTelegramDM(userId: number, text: string) {
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
export function getStartOfWeek(): Date {
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

            console.log("parsed", message, fromUser)

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