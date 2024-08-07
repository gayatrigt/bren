import { NextApiRequest, NextApiResponse } from 'next';
import { botclaim, botReminder, botReplySuccess } from './functions/botReply';

const allFidsToNotify: any[] = [236671, 10095, 306404, 200375, 348814, 15211, 193367, 234692, 216511, 99, 234616, 385955, 3642, 239748, 1546, 1265, 270504, 431233, 16085, 428725, 196339, 601131, 211756, 17979, 1020, 505175, 815965, 239, 12626, 602, 20431, 470962, 11528, 511655, 508409, 345272, 294100, 211068, 738903, 373714, 790081]

// const allFidsToNotify: any[] = [479, 469678]

interface NeynarUser {
    fid: number;
    username: string;
    // Add other properties as needed
}

interface NeynarResponse {
    users: NeynarUser[];
}

async function fetchUsernames(fids: number[]): Promise<Record<number, string>> {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`, {
        headers: {
            'accept': 'application/json',
            'api_key': process.env.NEYNAR_API_KEY || ''
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user details from Neynar');
    }

    const data: NeynarResponse = await response.json();
    console.log('Neynar API Response:', JSON.stringify(data, null, 2));

    const usernames = data.users.reduce((acc: Record<number, string>, user: NeynarUser) => {
        if (user.username) {
            acc[user.fid] = user.username;
        }
        return acc;
    }, {});

    console.log('Extracted Usernames:', JSON.stringify(usernames, null, 2));

    return usernames;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Assuming allFidsToNotify is defined earlier in your code
        const usernames = await fetchUsernames(allFidsToNotify);

        // 4. Send bot replies
        const replyPromises = Object.values(usernames).map(botclaim)

        const results = await Promise.all(replyPromises);

        console.log(results)

        res.status(200).json({
            message: 'Weekly notification process completed',
        });

    } catch (error) {
        console.error('Error in weekly notification process:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}