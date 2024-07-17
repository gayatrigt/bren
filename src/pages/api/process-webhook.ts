// pages/api/process-webhook.ts
import { NextApiRequest, NextApiResponse } from "next";
import { processWebhookData } from "./webHookProcessing";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { hash } = req.body;

    if (!hash) {
        return res.status(400).json({ message: 'Hash is required' });
    }

    try {
        await processWebhookData(hash);
        res.status(200).json({ message: 'Webhook data processed successfully' });
    } catch (error) {
        console.error('Error processing webhook data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}