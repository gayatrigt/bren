import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { env } from '~/env';

export const config = {
    runtime: "edge"
}

const NEYNAR_API_URL = 'https://api.neynar.com/v2/farcaster/user/bulk';
const ALCHEMY_API_URL = 'https://base-mainnet.g.alchemy.com/nft/v3';
const NFT_CONTRACT_ADDRESSES = [
    '0x1de473537591a665687defbe0f48a42d3cfa9556',
    '0x59ca61566C03a7Fb8e4280d97bFA2e8e691DA3a6',
    '0x05df46564c489a92492400298c88f032c8c21e96'
];

export default async function GET(req: NextRequest) {
    console.log("🚀 ~ GET ~ req.url:", env.BASE_URL + req.url)

    const { searchParams } = new URL(env.BASE_URL + req.url);
    const fid = searchParams.get('fid');
    console.log("🚀 ~ GET ~ fid:", fid)

    if (!fid) {
        return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const neynarApiKey = env.NEYNAR_API_KEY;
    const alchemyApiKey = env.ALCHEMY_API_KEY;

    if (!neynarApiKey || !alchemyApiKey) {
        return NextResponse.json({ error: "API keys are missing" }, { status: 500 });
    }

    try {
        // Step 1: Get Ethereum addresses from Neynar
        const neynarResponse = await axios.get(`${NEYNAR_API_URL}?fids=${fid}`, {
            headers: {
                'accept': 'application/json',
                'api_key': neynarApiKey
            }
        });

        const ethAddresses = neynarResponse.data.users[0].verified_addresses.eth_addresses;
        console.log("Ethereum addresses:", ethAddresses);

        // Step 2: Check if any address holds any of the NFTs
        let isWhitelisted = false;

        for (const address of ethAddresses) {
            const alchemyResponse = await axios.get(`${ALCHEMY_API_URL}/${alchemyApiKey}/getNFTsForOwner`, {
                params: {
                    owner: address,
                    contractAddresses: NFT_CONTRACT_ADDRESSES,
                    withMetadata: false,
                    pageSize: 100
                }
            });

            if (alchemyResponse.data.ownedNfts.length > 0) {
                isWhitelisted = true;
                break;
            }
        }

        return NextResponse.json({ isWhitelisted }, { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "An error occurred while checking eligibility" }, { status: 500 });
    }
}