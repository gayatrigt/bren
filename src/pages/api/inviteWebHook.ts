import { NextApiRequest, NextApiResponse } from "next";
import { processWebhookData } from "./webHookProcessing";
import { inviteWeebHookResponse } from "~/utils/inviteWebhook";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Webhook received');

    if (req.method !== 'POST') {
        console.error('Method Not Allowed');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const webhookData = req.body as inviteWeebHookResponse;

        if (!webhookData || !webhookData.data) {
            console.error('Invalid webhook data structure');
            return res.status(400).json({ message: 'Invalid webhook data structure' });
        }

        const hash = webhookData.data.hash;

        console.log('Extracted Hash:', hash);

        // Make an API call to process the data
        fetch(`https://bren.vercel.app/api/inviteWebhookProcessing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hash }),
        }).catch(error => console.error('Error calling process API:', error));

        setTimeout(() => {
            // Respond to the webhook immediately
            return res.status(200).json({ message: 'Webhook received successfully' });
        }, 200)

    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }

    console.log('Webhook processing completed');
}