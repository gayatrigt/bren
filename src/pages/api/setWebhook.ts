import { NextApiRequest, NextApiResponse } from 'next';
import { setWebhook } from './telegramWebhook';

const SECRET_KEY = process.env.WEBHOOK_SECRET_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const result = await setWebhook();
        res.status(200).json({ message: 'Webhook set successfully', result });
    } catch (error) {
        console.error('Error setting webhook:', error);
        res.status(500).json({ error: 'Failed to set webhook' });
    }
}