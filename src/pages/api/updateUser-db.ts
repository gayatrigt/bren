// import type { NextApiRequest, NextApiResponse } from 'next';
// import { db } from '~/server/db';
// import { NeynarUser } from '~/contracts/NeynarUser';
// import { env } from '~/env';

// const BATCH_SIZE = 100; // Neynar API allows up to 100 FIDs per request

// async function fetchUsersBatch(fids: number[]): Promise<NeynarUser> {
//     const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`, {
//         headers: {
//             'accept': 'application/json',
//             'api_key': env.NEYNAR_API_KEY
//         }
//     });

//     if (!response.ok) {
//         throw new Error('Failed to fetch user details from Neynar');
//     }

//     return await response.json();
// }

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method !== 'POST') {
//         return res.status(405).json({ error: 'Method not allowed' });
//     }

//     try {
//         let updatedCount = 0;
//         let cursor: number | undefined;

//         while (true) {
//             // Fetch a batch of users from the database
//             const users = await db.user.findMany({
//                 take: BATCH_SIZE,
//                 skip: cursor ? 1 : 0,
//                 cursor: cursor ? { fid: cursor } : undefined,
//                 select: { fid: true },
//                 orderBy: { fid: 'asc' },
//             });

//             if (users.length === 0) break;

//             const fids = users.map(user => user.fid);

//             // Fetch user details from Neynar
//             const neynarData = await fetchUsersBatch(fids);

//             // Update users in the database
//             const updatePromises = neynarData.users.map(async (neynarUser) => {
//                 await db.user.update({
//                     where: { fid: neynarUser.fid },
//                     data: {
//                         walletAddress: neynarUser.verified_addresses.eth_addresses[0],
//                         farcasterDetails: {
//                             upsert: {
//                                 create: {
//                                     fid: neynarUser.fid,
//                                     display_name: neynarUser.display_name,
//                                     username: neynarUser.username,
//                                     pfp: neynarUser.pfp_url,
//                                 },
//                                 update: {
//                                     display_name: neynarUser.display_name,
//                                     username: neynarUser.username,
//                                     pfp: neynarUser.pfp_url,
//                                 },
//                             },
//                         },
//                     },
//                 });
//             });

//             await Promise.all(updatePromises);

//             updatedCount += neynarData.users.length;
//             cursor = users[users.length - 1]?.fid;

//             console.log(`Updated ${updatedCount} users so far.`);
//         }

//         res.status(200).json({
//             message: 'User update process completed',
//             updatedUsers: updatedCount
//         });

//     } catch (error) {
//         console.error('Error updating users:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }