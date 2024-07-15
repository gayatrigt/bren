import { db } from "~/server/db";
import { getUserById } from "~/server/neynar";
import { botReply, botReplyFail, botReplySuccess } from "./botReply";
import { NeynarUser } from "~/contracts/NeynarUser";

const validHashtags = ["integrity", "teamwork", "tenacity", "creativity", "optimism"];

export async function processTip(
    tipAmount: number,
    currentAllowance: number,
    fromFid: number,
    fromAddress: string,
    fromUsername: string,
    toFid: number,
    message: string,
    hashtagValue: string,
    castHash: string,
    neynarCast: any
) {
    try {
        // Convert hashtagValue to lowercase for case-insensitive comparison
        const lowercaseHashtag = hashtagValue.toLowerCase();
        console.log('Lowercase Hashtag:', lowercaseHashtag);
        // Check if the fromFid is following brenbot
        const following = await isFollowing(fromFid);
        console.log('Is following brenbot:', following);

        if (!following) {
            const result = await botReplyFail(
                castHash,
                `Hey @${fromUsername}!\nYou cannot tip bren as you are not following @brenbot.`,
                "Tip Failed to be processed",
                currentAllowance
            );

            if (result.success) {
                console.log('Reply posted successfully:', result.castHash);
            } else {
                console.error('Failed to post reply:', result.message);
            }
            return; // Exit the function early
        }

        // Check if the hashtag is valid
        if (!validHashtags.includes(lowercaseHashtag)) {
            const result = await botReplyFail(
                castHash,
                `Hey @${fromUsername}!\nYou cannot tip without a valid value. Please use one of the following hashtags: ${validHashtags.map(tag => '#' + tag.charAt(0).toUpperCase() + tag.slice(1)).join(", ")}.`,
                "You cannot tip Bren without a valid value",
                currentAllowance
            );

            if (result.success) {
                console.log('Reply posted successfully:', result.castHash);
            } else {
                console.error('Failed to post reply:', result.message);
            }
            return; // Exit the function early
        }

        if (currentAllowance >= tipAmount) {
            const toDetails = await getUserById(toFid);

            if (!toDetails) {
                throw new Error('toUser details not found');
            }

            const toAddress = toDetails.verified_addresses.eth_addresses[0];
            const toUsername = toDetails.username;

            if (!toAddress) {
                const result = await botReplyFail(
                    castHash,
                    `Hey @${fromUsername}!\nYou cannot tip @${toUsername} as they don't have a wallet connected.`,
                    "Tip Failed to be processed",
                    currentAllowance
                );

                if (result.success) {
                    console.log('Reply posted successfully:', result.castHash);
                } else {
                    console.error('Failed to post reply:', result.message);
                }
                return; // Exit the function early
            }

            await db.$transaction(async (prisma) => {
                const data = {
                    amount: tipAmount,
                    fromFid,
                    fromAddress,
                    fromUsername,
                    toUsername,
                    toFid,
                    toAddress: toAddress,
                    text: message,
                    value: hashtagValue,
                    castHash,
                    parentCastHash: neynarCast.parent_author ? neynarCast.parent_hash : null,
                    link: `https://warpcast.com/${fromUsername}/${castHash}`,
                };

                console.log('Attempting to create transaction in database:', data);

                const createdTransaction = await prisma.transaction.create({ data });

                await upsertUserRankings(fromFid, fromAddress, tipAmount, false);
                await upsertUserRankings(toFid, toAddress, tipAmount, true);

                // ... (keep the existing bot reply logic)
                const allowanceLeft = currentAllowance - tipAmount;
                const result = await botReplySuccess(
                    castHash,
                    `Hey @${fromUsername}!\nYou have successfully tipped ${tipAmount} $bren to @${toUsername} for #${hashtagValue}.`,
                    toFid,
                    tipAmount,
                    allowanceLeft
                );

                if (result.success) {
                    console.log('Reply posted successfully:', result.castHash);
                } else {
                    console.error('Failed to post reply:', result.message);
                }
            });

        } else {
            const result = await botReplyFail(
                castHash,
                `Hey @${fromUsername}!\nYou cannot tip ${tipAmount} $bren.\nAllowance left : ${currentAllowance} $bren`,
                `Your tip failed due to insufficient allowance`,
                currentAllowance
            );

            if (result.success) {
                console.log('Reply posted successfully:', result.castHash);
            } else {
                console.error('Failed to post reply:', result.message);
            }
        }
    } catch (error) {
        console.error('Error in tip processing:', error);
        const errorResult = await botReply(
            castHash,
            `Hey @${fromUsername}!\nSorry, there was an error processing your tip. Please try again later.`,
            "Tip Failed to Process",
        );
        if (errorResult.success) {
            console.log('Error reply posted successfully:', errorResult.castHash);
        } else {
            console.error('Failed to post error reply:', errorResult.message);
        }
    }
}

// Function to check if fromFid is following toFid using accountFollowCheck
async function isFollowing(fromFid: number): Promise<boolean> {
    try {
        const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=670648&viewer_fid=${fromFid}`;
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

        const neynarUser: NeynarUser = await response.json();

        const user = neynarUser.users[0]

        if (user) {
            const isFollowing = user.viewer_context.following;
            return isFollowing;
        }

        return false;
    } catch (error) {
        console.error('Error in isFollowing function:', error);
        // Depending on your error handling strategy, you might want to rethrow the error
        // or return a default value
        throw error;
    }
}

async function upsertUserRankings(fid: number, walletAddress: string, amount: number, isReceived: boolean) {
    await db.$transaction(async (prisma) => {
        // Ensure User exists
        await prisma.user.upsert({
            where: { fid: fid },
            update: { walletAddress: walletAddress },
            create: {
                fid: fid,
                walletAddress: walletAddress,
                // Add other required fields here
            }
        });

        // Update UserRankings
        await prisma.userRankings.upsert({
            where: { fid: fid },
            update: {
                walletAddress: walletAddress,
                [isReceived ? 'tipsReceived' : 'tipsSent']: { increment: amount },
                [isReceived ? 'tipsReceivedCount' : 'tipsSentCount']: { increment: 1 }
            },
            create: {
                fid: fid,
                walletAddress: walletAddress,
                [isReceived ? 'tipsReceived' : 'tipsSent']: amount,
                [isReceived ? 'tipsReceivedCount' : 'tipsSentCount']: 1
            }
        });
    });
}