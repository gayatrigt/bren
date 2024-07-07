import type { NextApiRequest, NextApiResponse } from 'next';
import { updateRankings } from '../updateRanking';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check for a secret token to secure the endpoint
    if (req.query.token !== process.env.CRON_SECRET_TOKEN) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        await updateRankings();
        res.status(200).json({ message: 'Rankings updated successfully' });
    } catch (error) {
        console.error('Error updating rankings:', error);
        res.status(500).json({ error: 'Failed to update rankings' });
    }
}