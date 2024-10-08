import { NextApiRequest, NextApiResponse } from 'next';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

async function sendWelcomeMessage(chatId: number) {
    const welcomeMessage = `
Hey Brens, 

Here's how you can interact with me:
• Tip other members: Mention me (@brenisbot) and use the format "10 $bren @username" to give Bren points.
• To start tipping, link you wallet by DMing me /connectwallet
• Check your balance: DM me /checkpoints to see your current Bren points.

Know more about bren here- https://www.bren.lol/

Happy building, and let's make the onchain world awesome together! 🚀
`;

    await sendTelegramDM(chatId, welcomeMessage);
}


export async function sendTelegramDM(userId: number, text: string, parse_mode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML') {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: userId,
            text: text,
            parse_mode: parse_mode,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send Telegram message: ${response.statusText}`);
    }
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
    console.log("tip message", text, replyToMessage);

    const match = text.match(/(?=.*\d)(?=.*\$bren)(?=.*@(\w+)).*/i);

    console.log("match:", match);
    if (!match || !match[1]) {
        return null;
    }

    const amountMatch = text.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[0], 10) : 0;
    let recipient = match[1];

    // If it's a reply, get the recipient from the replied-to message
    if (replyToMessage && replyToMessage.from && replyToMessage.from.username) {
        recipient = replyToMessage.from.username;
    }

    // Ensure the recipient is not 'brenisbot'
    if (recipient.toLowerCase() === 'brenisbot') {
        return null;
    }

    return { amount, recipient };
}

// Helper function to check if the message is a command
function isCommand(text: string): boolean {
    return text.startsWith('/');
}

// Helper function to check if the message is a personal message to the bot
function isPersonalMessage(chat: any): boolean {
    return chat.type === 'private';
}

// Main webhook handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST' || req.method === 'GET') {
        // Acknowledge receipt immediately
        const update = req.body;

        console.log("webhook received 1", update)

        // Check if the bot was added to a group
        if (update.message?.new_chat_member?.username === 'brenisbot') {
            console.log("Bot added to group");
            const chatId = update.message.chat.id;
            await sendWelcomeMessage(chatId);
            return res.status(200).json({ ok: true });
        }

        // Process the message asynchronously
        if (!update.message?.text) {
            console.log("Irrelevant message: no text found");
            return res.status(200).json({ ok: true });
        }

        const message = update.message;
        const fromUser = message.from?.username;
        const fromUserid = message.from?.id
        const messageId = message.message_id.toString();
        const chatId = message.chat.id;
        const chatName = message.chat.title || 'Private Chat';
        const text = message.text;

        console.log("parsed 2", message, fromUser)

        // Check if it's a command or a personal message to the bot
        if (isCommand(text) || isPersonalMessage(message.chat)) {
            console.log('Command or personal message detected. Sending to command processor...');

            const response = await fetch('https://www.bren.lol/api/processCommand', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fromUsername: fromUser,
                    fromUserid: fromUserid,
                    first_name: message.from.first_name,
                    last_name: message.from.last_name,
                    text: text,
                    messageId,
                    chatId,
                    chatName,
                    isCommand: isCommand(text),
                    isPersonalMessage: isPersonalMessage(message.chat)
                }),
            });

            if (response.ok) {
                console.log('Command or personal message processed successfully.');
            } else {
                console.error('Error processing command or personal message:', await response.text());
            }
            return res.status(200).json({ ok: true });
        }

        if (!isBotMentioned(message.text)) {
            console.log("Irrelevant Message")
            return res.status(200).json({ ok: true });;
        }

        const tipInfo = parseTipMessage(message.text, message.reply_to_message);

        console.log("tip", tipInfo)

        if (!(fromUser && tipInfo)) {
            console.log("no relevant info")
            return res.status(200).json({ ok: true });
        }

        console.log('Tip info parsed successfully. Calling processTip API...', fromUser);

        const response = await fetch('https://www.bren.lol/api/processTGTip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fromUsername: fromUser,
                fromUserid: fromUserid,
                first_name: message.from.first_name,
                last_name: message.from.last_name,
                toUsername: tipInfo.recipient,
                amount: tipInfo.amount,
                messageId,
                chatId,
                chatName
            }),
        });

        // delay for 100ms
        await new Promise(resolve => setTimeout(resolve, 10000));

        if (response.ok) {
            console.log('Tip processed successfully.');
        } else {
            console.error('Error processing tip:', await response.text());
        }
        console.log({ response: response.json() })

        return res.status(200).json({ ok: true });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}