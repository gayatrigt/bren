// import { NextApiRequest, NextApiResponse } from 'next';
// import { NeynarWebhook } from '~/contracts/NeynarWebhook';
// import { db } from '~/server/db';
// import { getUserById } from '~/server/neynar';
// import { stack } from '~/server/stack';
// const sdk = require('api')('@neynar/v2.0#281yklumre2o7');
// import { DuneClient } from "@duneanalytics/client-sdk";
// const dune = new DuneClient(process.env.DUNE_API_KEY!);

// // Add body-parser to parse the request body
// export const config = {
//     api: {
//         bodyParser: {
//             sizeLimit: '1mb',
//         },
//     },
// };

// interface reqBody {
//     "fid": number;
//     "isAllies": boolean;
//     "isSplitter": boolean;
//     "isFollowingChannel": boolean;
//     "isInvited": boolean;
// }
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     try {
//         if (req.method !== 'GET') {
//             console.error('Method Not Allowed');
//             return res.status(405).json({ message: 'Method Not Allowed ' });
//         }

//         const queryObj = req.query

//         console.log(queryObj);
//         console.log("FID BODY", queryObj?.fid);

//         const isFollowingChannel = queryObj.isFollowingChannel
//         const isAllies = queryObj.isAllies
//         const isSplitter = queryObj.isSplitter
//         const fid = queryObj.fid

//         // const { fid, isFollowingChannel, isSplitter, isAllies } = req.body;

//         console.log("FID BODY", fid);
//         console.log('isFOllowing', isFollowingChannel);
//         console.log('isSPlitter', fid);
//         console.log('isALLiES', isAllies);

//         console.log('Fid str', fid!.toString());

//         // const senderDetails = await getUserById(fid!.toString(), fid!.toString());

//         const calculateAllowancePoints = (
//             isPowerBadgeHolder: boolean,
//             isAllies: boolean,
//             isSplitter: boolean,
//             isFollowingChannel: boolean
//         ): number => {
//             let maxAllowancePoints = 0;
//             let userType = ""

//             if (isPowerBadgeHolder) {
//                 maxAllowancePoints = 100;
//                 userType = "POWER_BADGE"
//             }

//             if (isFollowingChannel) {
//                 maxAllowancePoints = Math.max(maxAllowancePoints, 25);
//                 userType = "FOLLOWER"
//             }

//             if (isSplitter) {
//                 maxAllowancePoints = Math.max(maxAllowancePoints, 300);
//                 userType = "SPLITTERS"
//             }

//             if (isAllies) {
//                 maxAllowancePoints = Math.max(maxAllowancePoints, 500);
//                 userType = "ALLIES"
//             }

//             return maxAllowancePoints;
//         };

//         const allowancePoints = calculateAllowancePoints(
//             // senderDetails?.power_badge!,
//             Boolean(isAllies!),
//             Boolean(isSplitter!),
//             Boolean(isFollowingChannel!)
//         );

//         const user = await db.user.findUnique({
//             where: {
//                 fid: Number(fid!),
//                 walletAddress: senderDetails!.verified_addresses.eth_addresses[0]
//             }
//         });

//         const dateToday = new Date();
//         const oneWeekAgo = new Date(dateToday.getTime() - 7 * 24 * 60 * 60 * 1000);

//         if (!user?.isAllowanceGiven || user?.allowanceGivenAt < oneWeekAgo) {

//             await stack.track("allowance", {
//                 account: senderDetails?.verified_addresses.eth_addresses[0]!,
//                 points: allowancePoints
//             });

//             console.log('allowance set successfully');


//             await db.user.update({
//                 where: {
//                     fid: Number(fid!),
//                     walletAddress: senderDetails!.verified_addresses.eth_addresses[0]
//                 },
//                 data: {
//                     isAllowanceGiven: true,
//                     allowanceGivenAt: dateToday
//                 }
//             });
//             console.log('db updated');

//             return res.status(200).json({ allowancePoints, message: 'Allowance Reset Successfully' });
//         }

//         return res.status(200).json({ message: 'There is time left to reset allowance' });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: 'Internal Server Error' });
//     }
// }

import type { NextApiRequest, NextApiResponse } from 'next'
import { env } from '~/env';
import { CheckEligibilityAPIResponse } from './whitelist/fbi-token';
import { fids } from './whitelist/fids';

async function getFidFromNeynar(address: string): Promise<number | null> {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`;

    try {
        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'api_key': env.NEYNAR_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from Neynar API');
        }

        const data = await response.json();
        const user = data[address.toLowerCase()]?.[0];
        return user ? user.fid : null;
    } catch (error) {
        console.error('Error fetching from Neynar API:', error);
        return null;
    }
}

export async function checkEligibility(fromFid: number): Promise<boolean | undefined> {
    console.log('Checking eligibility for FID:', fromFid);

    // First, check if the FID exists in the fids object
    if (fids.includes(fromFid)) {
        console.log('FID found in local database');
        return true
    }

    console.log('FID not found in local database, checking whitelist API');

    // If not in fids object, call the local API
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/whitelist/fbi-token?fid=${fromFid}`);
        const result: CheckEligibilityAPIResponse = await response.json();

        if (result.data.TokenBalances?.TokenBalance === null) {
            console.log('User is not whitelisted');
            return false;
        } else if (result.data.TokenBalances?.TokenBalance[0]?.tokenId === '1') {
            console.log('User is whitelisted');
            return true;
        } else {
            console.log('Unexpected result from whitelist API');
            return undefined
        }
    } catch (error) {
        console.error('Error checking whitelist:', error);
        return undefined
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { address, fid } = req.query;

    if (!address && !fid) {
        return res.status(400).json({ error: 'Either address or FID is required' });
    }

    if (address && fid) {
        return res.status(400).json({ error: 'Provide either address or FID, not both' });
    }

    try {
        let userFid: number;

        if (address) {
            if (typeof address !== 'string') {
                return res.status(400).json({ error: 'Invalid address format' });
            }
            const fetchedFid = await getFidFromNeynar(address);
            if (!fetchedFid) {
                return res.status(404).json({ error: 'FID not found for the given address' });
            }
            userFid = fetchedFid;
        } else {
            if (typeof fid !== 'string' || !/^\d+$/.test(fid)) {
                return res.status(400).json({ error: 'Invalid FID format' });
            }
            userFid = parseInt(fid, 10);
        }

        const isEligible = await checkEligibility(userFid);

        if (isEligible === undefined) {
            return res.status(500).json({ error: 'Error checking eligibility' });
        }

        const baseUrl = 'https://warpcast.com/~/compose?text=';
        let message, link;

        if (isEligible) {
            message = 'You are eligible to tip bren!';
            link = `${baseUrl}${encodeURIComponent('@brenbot [add points] $bren [add user] for [add any value #Integrity #Teamwork #Tenacity #Creativity #Optimism]')}`;
        } else {
            message = 'You cannot tip bren, but you can get an invite from Yele or Gayatri';
            link = `${baseUrl}${encodeURIComponent('@yele @gayatri Can I get an invite to tip Bren?')}&channelKey=bren`;
        }

        res.status(200).json({ isEligible, message, link });
    } catch (error) {
        console.error('Error in eligibility check:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}