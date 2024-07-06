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