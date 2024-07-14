import { NextApiRequest, NextApiResponse } from "next";
import { processWebhookData } from "./webHookProcessing";
import { z } from "zod";

const WebhookSchema = z.object({
    created_at: z.number(),
    type: z.string(),
    data: z.object({
        object: z.literal('cast'),
        hash: z.string(),
        thread_hash: z.string(),
        parent_hash: z.string().nullable(),
        parent_url: z.string().nullable(),
        root_parent_url: z.string().nullable(),
        parent_author: z.object({
            fid: z.number().nullable(),
        }),
        author: z.object({
            object: z.literal('user'),
            fid: z.number(),
            custody_address: z.string(),
            username: z.string(),
            display_name: z.string(),
            pfp_url: z.string(),
            profile: z.record(z.unknown()),
            follower_count: z.number(),
            following_count: z.number(),
            verifications: z.array(z.unknown()),
            verified_addresses: z.record(z.unknown()),
            active_status: z.string(),
            power_badge: z.boolean(),
        }),
        text: z.string(),
        timestamp: z.string(),
        embeds: z.array(z.unknown()),
        reactions: z.object({
            likes_count: z.number(),
            recasts_count: z.number(),
            likes: z.array(z.unknown()),
            recasts: z.array(z.unknown()),
        }),
        replies: z.object({
            count: z.number(),
        }),
        channel: z.unknown().nullable(),
        mentioned_profiles: z.array(z.unknown()),
    }),
});

// Define the type based on the schema
type WebhookData = z.infer<typeof WebhookSchema>;

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
        const webhookData = WebhookSchema.parse(req.body);

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