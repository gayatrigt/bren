import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const AIRSTACK_API_URL = 'https://api.airstack.xyz/graphql';

export interface checkAccountFollow {
    data: Data
}

export interface Data {
    SocialFollowings: SocialFollowings
}

export interface SocialFollowings {
    Following: Following[]
}

export interface Following {
    followingProfileId: string
}

const createQuery = (followerProfileId: string) => `
query MyQuery {
  SocialFollowings(
    input: {filter: {followerProfileId: {_eq: "${followerProfileId}"}, followingProfileId: {_eq: "670648"}}, blockchain: ALL}
  ) {
    Following {
      followingProfileId
    }
  }
}
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { fid } = req.query;

    if (!fid || Array.isArray(fid)) {
        return res.status(400).json({ error: "FID is required and must be a string" });
    }

    const apiKey = process.env.AIRSTACK_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "Airstack API key is missing" }, { status: 500 });
    }

    try {
        const query = createQuery(fid);

        const response = await axios.post(AIRSTACK_API_URL, {
            query: query,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
        });

        const data = response.data;

        return res.status(200).json(data);
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "An error occurred while processing your request" });
    }
}
