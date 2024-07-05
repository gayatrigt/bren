import { NextApiRequest, NextApiResponse } from "next";


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

interface ExtractedData {
    hash: string;
    authorFid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    powerBadge: boolean;
    text: string;
    mentionedProfiles: unknown[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        console.error('Method Not Allowed');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    res.status(200).json({ message: 'Webhook received' });

    try {
        const webhookData = req.body as WebhookResponse;

        const extractedData: ExtractedData = {
            hash: webhookData.data.hash,
            authorFid: webhookData.data.author.fid,
            username: webhookData.data.author.username,
            displayName: webhookData.data.author.display_name,
            pfpUrl: webhookData.data.author.pfp_url,
            powerBadge: webhookData.data.author.power_badge,
            text: webhookData.data.text,
            mentionedProfiles: webhookData.data.mentioned_profiles,
        };

        console.log('Extracted Data:', extractedData);

        // Process the data or send a response as needed
        res.status(200).json({ message: 'Webhook received and processed successfully' });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}