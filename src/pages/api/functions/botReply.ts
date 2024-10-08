import { db } from "~/server/db";

const sdk = require('api')('@neynar/v2.0#281yklumre2o7');

interface BotReplyResult {
    success: boolean;
    message: string;
    castHash?: string;
}

export async function botReplyFail(userHash: string, castText: string, message: string, allowance: number): Promise<BotReplyResult> {
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
                    url: `https://bren-frames.vercel.app/frames/fail?message=${encodeURIComponent(message)}&all=${encodeURIComponent(allowance)}`
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

export async function botReplySuccess(userHash: string, castText: string, fid: number, points: number, allowance: number): Promise<BotReplyResult> {
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
                    url: `https://bren-frames.vercel.app/frames/success?fid=${encodeURIComponent(fid)}&tip=${encodeURIComponent(points)}&all=${encodeURIComponent(allowance)}`
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

export async function bottip(castText: string, fid: number): Promise<BotReplyResult> {
    try {

        // Post the new reply
        const response = await sdk.postCast({
            signer_uuid: process.env.SIGNER_UUID,
            text: castText,
            embeds: [
                {
                    url: `https://bren-frames.vercel.app/frames/base-builds/${fid}`
                }
            ],
        }, { api_key: process.env.NEYNAR_API_KEY });

        const castHash = response.data.cast.hash;

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

export async function botReminder(username: string | null, fid: number): Promise<BotReplyResult> {
    try {

        // Post the new reply
        const response = await sdk.postCast({
            signer_uuid: process.env.SIGNER_UUID,
            text: `Hey @${username} recognize you brens before your allowance expires in 24hrs`,
            embeds: [
                {
                    url: `https://bren-frames.vercel.app/frames/${fid}}`
                }
            ],
        }, { api_key: process.env.NEYNAR_API_KEY });

        const castHash = response.data.cast.hash;

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

export async function botclaim(username: string | null): Promise<BotReplyResult> {
    try {

        // Post the new reply
        const response = await sdk.postCast({
            signer_uuid: process.env.SIGNER_UUID,
            text: `Hey @${username} you are earning $BUILD for being a bren!`,
            embeds: [
                {
                    url: `https://bren-frames.vercel.app/frames}`
                }
            ],
        }, { api_key: process.env.NEYNAR_API_KEY });

        const castHash = response.data.cast.hash;

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


export async function botReply(userHash: string, castText: string, message: string): Promise<BotReplyResult> {
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
                    url: `https://bren-frames.vercel.app/frames/not-eligible?message=${encodeURIComponent(message)}`
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



export async function botReplyInvite(userHash: string, castText: string, invitorfid: number, fid: number): Promise<BotReplyResult> {
    try {

        // Post the new reply
        const response = await sdk.postCast({
            signer_uuid: process.env.SIGNER_UUID,
            text: castText,
            parent: userHash,
            embeds: [
                {
                    url: `https://bren-frames.vercel.app/frames/invite?invitor=${encodeURIComponent(invitorfid)}&fid=${encodeURIComponent(fid)}`
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

export async function botReplywihtoutFrame(userHash: string, castText: string): Promise<BotReplyResult> {
    try {

        // Post the new reply
        const response = await sdk.postCast({
            signer_uuid: process.env.SIGNER_UUID,
            text: castText,
            parent: userHash,
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