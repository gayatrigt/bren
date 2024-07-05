import { Cast, Root } from "~/contracts/NeynarCast";

export async function processWebhookData(hash: string) {
    console.log('processWebhookData started');

    try {
        const castHash = hash;
        console.log("Hash:", castHash);

        const url = `https://api.neynar.com/v2/farcaster/cast?identifier=${castHash}&type=hash`;
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                api_key: process.env.NEYNAR_API_KEY || ''
            }
        };

        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const neynarData: Root = await response.json();

        // Save the data as NeynarCast
        const neynarCast: Cast = neynarData.cast;

        console.log("Neynar Cast Data:", JSON.stringify(neynarCast, null, 2));

        // Here you can perform further operations with neynarCast
        // For example, you might want to save it to a database

    } catch (error) {
        console.error('Error in processWebhookData:', error);
    }
}

