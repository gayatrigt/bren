import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getStartOfWeek, sendTelegramDM } from './telegramWebhook';
import { db } from '~/server/db';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        fromUsername, fromUserid, text, isCommand, isPersonalMessage, first_name, last_name, messageId,
        chatId,
        chatName
    } = req.body;

    if (!isCommand && !isPersonalMessage) {
        return res.status(400).json({ error: 'Not a command or personal message' });
    }

    const command = text.split(' ')[0].toLowerCase();

    try {
        let message: string;

        switch (command) {
            case '/start':
                message = await handleStart();
                break;
            case '/connectwallet':
                message = handleConnectWallet(fromUsername);
                break;
            case '/checkallowance':
                message = await handleCheckAllowance(fromUsername);
                break;
            case '/values':
                message = await handleValue();
                break;
            case '/checkpoints':
                message = await handleCheckPoints(fromUsername);
                break;
            default:
                message = 'Hey bren!\nThat is not a valid command. Please use:\n/connectwallet\n/checkallowance\n/values\n/checkpoints';
        }

        // Send the message back to the user via Telegram
        await sendTelegramDM(fromUserid, message);

        return res.status(200).json({ success: true, message: 'Response sent to user' });
    } catch (error) {
        console.error('Error processing command:', error);
        return res.status(500).json({ error: 'An error occurred while processing the command' });
    }
}

async function handleStart(): Promise<string> {
    return "Hey bren! Here are the available commands:\n" +
        "/connectwallet - Connect your wallet\n" +
        "/checkallowance - Check your remaining allowance\n" +
        "/values - Know the bren vales";
}

function handleConnectWallet(username: string): string {
    const encodedUsername = encodeURIComponent(username);
    const link = `https://www.bren.lol/telegram/link?telegramUsername=${encodedUsername}`;
    return `Please click on this link to connect your wallet: ${link}`;
}

async function handleCheckAllowance(username: string): Promise<string> {
    const user = await db.user.findUnique({
        where: { tgUsername: username },
        select: { id: true }
    });

    if (!user) {
        return 'User not found. Please connect your wallet first.';
    }

    const startOfWeek = getStartOfWeek();
    const tipsSentThisWeek = await db.transaction.aggregate({
        where: {
            fromUserId: user.id,
            createdAt: { gte: startOfWeek },
        },
        _sum: {
            amount: true
        },
    });

    const totalAllowance = 500;
    const remainingAllowance = totalAllowance - (tipsSentThisWeek._sum.amount || 0);
    return `Your remaining allowance for this week is: ${remainingAllowance.toFixed(2)}`;
}

async function handleCheckPoints(username: string): Promise<string> {
    const user = await db.user.findUnique({
        where: { tgUsername: username },
        select: { id: true }
    });

    if (!user) {
        return 'User not found. Please connect your wallet first.';
    }

    const userRankings = await db.userRankings.findUnique({
        where: { userId: user.id },
        select: { tipsReceived: true }
    });

    if (!userRankings) {
        return 'No ranking information found for this user.';
    }

    return `You have ${userRankings.tipsReceived?.toFixed(2)} $bren points in total.`
}

async function handleValue(): Promise<string> {
    return "The based values are integrity, teamwork, tenacity, creativity, and optimism. These values guide the behavior and contributions of the $bren community.";
}