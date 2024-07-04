import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const AIRSTACK_API_URL = 'https://api.airstack.xyz/graphql';

export interface CheckEligibilityAPIResponse {
    data: Data
}

interface Data {
    FarcasterChannelParticipants?: FarcasterChannelParticipants
    TokenBalances?: TokenBalances
}

interface FarcasterChannelParticipants {
    FarcasterChannelParticipant: FarcasterChannelParticipant[]
}

interface FarcasterChannelParticipant {
    channelName: string
    lastCastedTimestamp?: string
    lastFollowedTimestamp: string
}

interface TokenBalances {
    TokenBalance: TokenBalance[]
}

interface TokenBalance {
    tokenId: string
}


const createQuery = (fc_fid: string) => `
query MyQuery {
  FarcasterChannelParticipants(
    input: {filter: {participant: {_eq: "fc_fid:${fc_fid}"}, channelId: {_eq: "bren"}, channelActions: {_eq: follow}}, blockchain: ALL}
  ) {
    FarcasterChannelParticipant {
      channelName
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
