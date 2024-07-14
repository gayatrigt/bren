import { NextApiRequest, NextApiResponse } from "next";
import { processWebhookData } from "./webHookProcessing";

interface WebhookResponse {
    created_at: number;
    type: string;
    data: {
        object: 'cast';
        hash: string;
        thread_hash: string;
        parent_hash: string | null;
        parent_url: string | null;
        root_parent_url: string | null;
        parent_author: {
            fid: number | null;
        };
        author: {
            object: 'user';
            fid: number;
            custody_address: string;
            username: string;
            display_name: string;
            pfp_url: string;
            profile: Record<string, unknown>;
            follower_count: number;
            following_count: number;
            verifications: unknown[];
            verified_addresses: Record<string, unknown>;
            active_status: string;
            power_badge: boolean;
        };
        text: string;
        timestamp: string;
        embeds: unknown[];
        reactions: {
            likes_count: number;
            recasts_count: number;
            likes: unknown[];
            recasts: unknown[];
        };
        replies: {
            count: number;
        };
        channel: unknown | null;
        mentioned_profiles: unknown[];
    };
}

const INVITE_WEBHOOK_URL = process.env.INVITE_WEBHOOK_URL || 'https://bren.vercel.app/api/inviteWebhookProcessing';
const TIP_WEBHOOK_URL = process.env.TIP_WEBHOOK_URL || 'https://bren.vercel.app/api/process-webhook';

async function callWebhook(url: string, hash: string) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error calling ${url}:`, error);
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Webhook received');

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const webhookData = req.body as WebhookResponse;

        if (!webhookData || !webhookData.data) {
            console.error('Invalid webhook data structure');
            return res.status(400).json({ message: 'Invalid webhook data structure' });
        }

        const { hash, text } = webhookData.data;

        console.log('Extracted Hash:', hash);
        console.log('Extracted Text:', text);

        const isInvite = /\binvite\b/i.test(text);
        const isTip = /\$bren/i.test(text);

        if (!isInvite && !isTip) {
            console.log('This message is neither an invite nor a tip');
            return res.status(200).json({ message: 'Webhook received, but no action taken' });
        }

        const webhookUrl = isInvite ? INVITE_WEBHOOK_URL : TIP_WEBHOOK_URL;
        callWebhook(webhookUrl, hash);

        await new Promise(resolve => setTimeout(resolve, 200));
        return res.status(200).json({ message: 'Webhook received and processed successfully' });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}