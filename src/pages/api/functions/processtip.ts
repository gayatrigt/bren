import { db } from "~/server/db";
import { getUserById } from "~/server/neynar";
import { botReply, botReplyFail, botReplySuccess } from "./botReply";

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

        // Check if the hashtag is valid
        if (!validHashtags.includes(lowercaseHashtag)) {
            const result = await botReplyFail(
                castHash,
                `Hey ${fromUsername}!\nYou cannot tip without a valid value. Please use one of the following hashtags: ${validHashtags.map(tag => '#' + tag.charAt(0).toUpperCase() + tag.slice(1)).join(", ")}.`,
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

            const data = {
                amount: tipAmount,
                fromFid,
                fromAddress,
                fromUsername,
                toUsername,
                toFid,
                toAddress: toAddress || null,
                text: message,
                value: hashtagValue,
                castHash,
                parentCastHash: neynarCast.parent_author ? neynarCast.parent_hash : null,
                link: `https://warpcast.com/${fromUsername}/${castHash}`,
            };

            console.log('Attempting to create transaction in database:', data);

            let createdTransaction;
            try {
                createdTransaction = await db.transaction.create({ data });
                console.log('Transaction created successfully:', createdTransaction);
            } catch (dbError) {
                console.error('Failed to create transaction in database:', dbError);
                throw new Error('Database transaction creation failed');
            }

            if (createdTransaction) {
                const allowanceLeft = currentAllowance - tipAmount;
                const result = await botReplySuccess(
                    castHash,
                    `Hey ${fromUsername}!\nYou have successfully tipped ${tipAmount} $bren to ${toUsername} for #${hashtagValue}.`,
                    toFid,
                    tipAmount,
                    allowanceLeft
                );

                if (result.success) {
                    console.log('Reply posted successfully:', result.castHash);
                } else {
                    console.error('Failed to post reply:', result.message);
                }
            } else {
                console.error('Transaction was not created in the database, skipping bot reply');
            }
        } else {
            const result = await botReplyFail(
                castHash,
                `Hey ${fromUsername}!\nYou cannot tip ${tipAmount} $bren.\nAllowance left : ${currentAllowance} $bren`,
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
            `Hey ${fromUsername}!\nSorry, there was an error processing your tip. Please try again later.`,
            "Tip Failed to Process",
        );
        if (errorResult.success) {
            console.log('Error reply posted successfully:', errorResult.castHash);
        } else {
            console.error('Failed to post error reply:', errorResult.message);
        }
    }
}