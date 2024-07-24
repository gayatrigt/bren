import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { env } from '~/env';

const AIRSTACK_API_URL = 'https://api.airstack.xyz/graphql';
export const config = {
    runtime: "edge"
}

export interface CheckEligibilityAPIResponse {
    data: Data
}

interface Data {
    TokenBalances?: TokenBalances
}

interface TokenBalances {
    TokenBalance: TokenBalance[]
}

interface TokenBalance {
    tokenId: number
}


const createQuery = (fc_fid: string) => `
query MyQuery {
  TokenBalances(
    input: {filter: {tokenAddress: {_eq: "0x1de473537591a665687defbe0f48a42d3cfa9556"}, owner: {_eq: "fc_fid:${fc_fid}"}}, blockchain: base}
  ) {
    TokenBalance {
      tokenId
    }
  }
}
`;

export default async function GET(req: NextRequest) {
    console.log("🚀 ~ GET ~ req.url:", env.BASE_URL + req.url)

    const { searchParams } = new URL(env.BASE_URL + req.url);
    const fid = searchParams.get('fid');
    console.log("🚀 ~ GET ~ fid:", fid)

    if (!fid) {
        return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const apiKey = env.AIRSTACK_API_KEY

    if (!apiKey) {
        return NextResponse.json({ error: "Airstack API key is missing" }, { status: 500 });
    }

    try {
        console.log(1)
        const query = createQuery(fid);
        console.log(2)

        const response = await axios.post(AIRSTACK_API_URL, {
            query: query,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
        });
        console.log(3)

        const data = response.data;

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}
