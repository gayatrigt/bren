import { db } from "~/server/db";
import { getUserById } from "~/server/neynar";
import { botReply } from "./botReply";

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
        if (currentAllowance >= tipAmount) {
            const toDetails = await getUserById(toFid, fromFid);

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
                const result = await botReply(
                    castHash,
                    `Hey ${fromUsername}!\nYou have successfully tipped ${tipAmount} $bren to ${toUsername}.\nAllowance left : ${allowanceLeft < 0 ? 0 : allowanceLeft} $bren`,
                    "Tip Successful",
                    "",
                    `You have successfully tipped ${tipAmount} $bren`
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
            const result = await botReply(
                castHash,
                `Hey ${fromUsername}!\nYou cannot tip ${tipAmount} $bren.\nAllowance left : ${currentAllowance} $bren`,
                "Tip Failed",
                "",
                `Your tip failed due to insufficient allowance`
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
            "Tip Failed",
            "",
            "Error processing tip"
        );
        if (errorResult.success) {
            console.log('Error reply posted successfully:', errorResult.castHash);
        } else {
            console.error('Failed to post error reply:', errorResult.message);
        }
    }
}