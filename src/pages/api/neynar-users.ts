import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { fids } = req.query;

    if (!fids) {
        return res.status(400).json({ error: 'Missing fids parameter' });
    }

    try {
        const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids}`, {
            headers: {
                'accept': 'application/json',
                'api_key': process.env.NEYNAR_API_KEY || ''
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user details from Neynar');
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}