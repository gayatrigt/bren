// import { PrismaClient } from '@prisma/client';
// import { json2csv } from 'json-2-csv';
// import { NextApiRequest, NextApiResponse } from 'next';

// const prisma = new PrismaClient();

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method === 'GET') {
//         try {
//             const transactions = await prisma.transaction.findMany();

//             const userTips = transactions.reduce<Record<string, number>>((acc, cur) => {
//                 const fid = cur.toFid;
//                 if (!fid) return acc

//                 if (!acc[fid]) {
//                     acc[fid] = 0;
//                 }
//                 acc[fid] += cur.amount;
//                 return acc;
//             }, {})


//             const sheetData = Object.keys(userTips).map(fid => ({ fid, amount: userTips[fid] }))
//             const csvData = json2csv(sheetData);

//             res.setHeader('Content-Type', 'text/csv');
//             res.setHeader('Content-Disposition', 'attachment; filename=database.csv');
//             res.status(200).send(csvData);
//         } catch (error) {
//             console.error('Error downloading database:', error);
//             res.status(500).json({ error: 'Failed to download database' });
//         }
//     } else {
//         res.status(405).json({ error: 'Method not allowed' });
//     }
// }