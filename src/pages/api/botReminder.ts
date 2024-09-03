// import { NextApiRequest, NextApiResponse } from 'next';
// import { PrismaClient } from '@prisma/client';
// import { getStartOfWeek, getUserAllowance } from './getUserStats';
// import { db } from '~/server/db';
// import { botReminder, botReplySuccess } from './functions/botReply';
// import { checkEligibility } from './checkEligibility';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method !== 'POST') {
//         return res.status(405).json({ error: 'Method not allowed' });
//     }

//     try {
//         // 1. Check if it's 24 hours before the start of the next week
//         const now = new Date();
//         const nextWeekStart = getStartOfWeek();
//         nextWeekStart.setDate(nextWeekStart.getDate() + 7);
//         const timeDiff = nextWeekStart.getTime() - now.getTime();
//         const hoursDiff = timeDiff / (1000 * 3600);

//         if (hoursDiff > 24 || hoursDiff < 0) {
//             return res.status(400).json({ error: 'Not within 24 hours of next week start' });
//         }

//         // 2. Get users with more than 10 allowance left
//         const currentWeekStart = getStartOfWeek();
//         const usersWithAllowance = await db.user.findMany({
//             where: {
//                 sentTransactions: {
//                     some: {
//                         createdAt: { gte: currentWeekStart }
//                     }
//                 }
//             }
//         });

//         const usersWithAllowanceLeft = await Promise.all(usersWithAllowance.map(async (user) => {
//             const totalAllowance = await getUserAllowance(user.walletAddress);
//             const weeklyTransactions = await db.transaction.aggregate({
//                 where: {
//                     fromAddress: user.walletAddress,
//                     createdAt: { gte: currentWeekStart },
//                 },
//                 _sum: { amount: true },
//             });
//             const weeklySpent = weeklyTransactions._sum.amount ? Number(weeklyTransactions._sum.amount) : 0;
//             const allowanceLeft = totalAllowance - weeklySpent;
//             return allowanceLeft > 10 ? user.fid : null;
//         }));

//         const fidsWithAllowance = usersWithAllowanceLeft.filter((fid): fid is number => fid !== null);

//         // 3. Check for users who received tips but have no outgoing transactions
//         const usersReceivedTips = await db.userRankings.findMany({
//             where: {
//                 tipsReceived: { gt: 0 },
//                 fid: { notIn: fidsWithAllowance },
//             },
//             select: { fid: true }
//         });

//         const newWhitelistedUsers = await Promise.all(usersReceivedTips.map(async (user) => {
//             if (await checkEligibility(user.fid)) {

//                 const existingUser = await db.user.findUnique({ where: { fid: user.fid } });
//                 if (!existingUser) {
//                     await createUser(user.fid);
//                 }
//                 return user.fid;
//             }
//             return null;
//         }));

//         const allFidsToNotify = [...fidsWithAllowance, ...newWhitelistedUsers.filter((fid): fid is number => fid !== null)];

//         console.log(allFidsToNotify)

//         // 4. Send bot replies
//         const replyPromises = allFidsToNotify.map(async (fid) => {
//             const user = await db.user.findUnique({
//                 where: { fid },
//                 select: { username: true }
//             });
//             if (!user) return null;

//             return botReminder(user.username, fid);
//         });

//         const results = await Promise.all(replyPromises);

//         res.status(200).json({
//             message: 'Weekly notification process completed',
//             notifiedUsers: results.filter(r => r && r.success).length,
//             totalUsers: allFidsToNotify.length
//         });

//     } catch (error) {
//         console.error('Error in weekly notification process:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// async function createUser(fid: number) {
//     const response = await fetch(`${process.env.NEXT_PUBLIC_BOT_BASE_URL}/api/createUser-db?fid=${fid}`, {
//         method: 'GET',
//         headers: {
//             'accept': 'application/json',
//         },
//     });

//     if (!response.ok) {
//         throw new Error('Failed to create user');
//     }

//     return await response.json();
// }