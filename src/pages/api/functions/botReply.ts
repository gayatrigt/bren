import { db } from "~/server/db";

const sdk = require('api')('@neynar/v2.0#281yklumre2o7');

interface BotReplyResult {
    success: boolean;
    message: string;
    castHash?: string;
}

export async function botReply(userHash: string, castText: string, tipStatus: string, msg: string, main: string): Promise<BotReplyResult> {
    try {
        // Check if a reply already exists
        const existingReply = await db.botReply.findUnique({
            where: {
                userCastHash: userHash
            }
        });

        if (existingReply) {
            return {
                success: false,
                message: "A reply to this cast already exists."
            };
        }

        // Post the new reply
        const response = await sdk.postCast({
            signer_uuid: process.env.SIGNER_UUID,
            text: castText,
            parent: userHash,
            embeds: [
                {
                    url: `${process.env.NEXT_PUBLIC_BASE_URL}/?tipStatus=${encodeURIComponent(tipStatus)}&msg=${encodeURIComponent(msg)}&main=${encodeURIComponent(main)}`
                }
            ],
        }, { api_key: process.env.NEYNAR_API_KEY });

        const castHash = response.data.cast.hash;

        // Update the database
        await db.botReply.create({
            data: {
                botcastHash: castHash,
                userCastHash: userHash,
            },
        });

        return {
            success: true,
            message: "Reply posted successfully.",
            castHash: castHash
        };

    } catch (error) {
        console.error('Error in botReply:', error);
        return {
            success: false,
            message: "An error occurred while posting the reply."
        };
    }
}