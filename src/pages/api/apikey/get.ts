import { NextApiRequest, NextApiResponse } from 'next';
import { Platform } from '@prisma/client';
import crypto from 'crypto';
import { db } from '~/server/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const onboardCredentials = await generateApiCredentials(Platform.ONBOARD);
        const blocassetCredentials = await generateApiCredentials(Platform.BLOCASSET);

        res.status(200).json({
            ONBOARD: onboardCredentials.apiKey,
            BLOCASSET: blocassetCredentials.apiKey
        });
    } catch (error) {
        console.error('Error generating API credentials:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await db.$disconnect();
    }
}

async function generateApiCredentials(platform: Platform) {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiSecret = crypto.randomBytes(64).toString('hex');

    const credential = await db.apiCredential.create({
        data: {
            platform,
            apiKey,
            apiSecret,
        },
    });

    console.log(`Generated credentials for ${platform}:`);
    console.log(`API Key: ${credential.apiKey}`);
    console.log(`API Secret: ${credential.apiSecret}`);

    return credential;
}