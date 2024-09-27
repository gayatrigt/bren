
import { Platform } from '@prisma/client';
import crypto from 'crypto';
import { db } from '~/server/db';

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

    return {
        Platform,
        "API": credential.apiKey
    }
}

async function main() {
    await generateApiCredentials(Platform.ONBOARD);
    await generateApiCredentials(Platform.BLOCASSET);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });