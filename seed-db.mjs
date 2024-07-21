// seed-db.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dummyUserRankings = Array(100).fill(null).map((_, index) => ({
    fid: index + 1,
    walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
    tipsReceived: Math.floor(Math.random() * 1000),
    tipsSent: Math.floor(Math.random() * 800),
    tipsReceivedCount: Math.floor(Math.random() * 50),
    tipsSentCount: Math.floor(Math.random() * 40),
}));

async function main() {
    console.log('Start seeding...');

    const createdRankings = await prisma.userRankings.createMany({
        data: dummyUserRankings,
        skipDuplicates: true,
    });

    console.log(`Seeding finished. Created ${createdRankings.count} records.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });