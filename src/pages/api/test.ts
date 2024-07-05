import { NextApiRequest, NextApiResponse } from 'next';
import { processWebhookData } from './webHookProcessing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const testHash = '0x07dd9706db42b2bb4b1c585f8f31f7e033592500'; // Use a known valid hash

    try {
        console.log('Test webhook processing started');
        await processWebhookData(testHash);
        console.log('Test webhook processing completed');
        res.status(200).json({ message: 'Test webhook processing completed' });
    } catch (error) {
        console.error('Error in test webhook:', error);
        res.status(500).json({ message: 'Error in test webhook processing' });
    }
}