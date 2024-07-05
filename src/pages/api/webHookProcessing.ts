import { error } from "console";
import { Cast, Root } from "~/contracts/NeynarCast";
import { db } from "~/server/db";
import { getUserById } from "~/server/neynar";
import { stack } from "~/server/stack";
const sdk = require('api')('@neynar/v2.0#281yklumre2o7');

// get cast details from Hash
// Get the user ans check if exitsts in db
// if user exists then check the cast message for the tip amount and value and the sender details
// check the user allowance and respond success or you dont have allowance
// if does not exists, check if eligible and then create user and give allowance
// the check message and response success tip
// if not eligible respond you are not eligoble to tip

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

        if (!neynarCast) {
            throw new Error("Cast is not valid")
        }

        console.log("Neynar Cast Data:", JSON.stringify(neynarCast, null, 2));

        const message = neynarCast.text

        if (!message) {
            throw new Error("Cast text is invalid")
        }

        // grab the amount fo the tip from the message, format: $250 bren using regex, amount should have $250 followed by bren
        let tipAmount = 0
        let hashtagValue = '';

        const amountFromText = message.match(/\$?\s*(\d+)\s*\$?\s*tren\b/i);

        if (amountFromText?.[1]) {
            tipAmount = parseInt(amountFromText?.[1]
                .replace(/\$/, '')
            );
        }

        console.log('Tip Amount:', tipAmount);

        if (!tipAmount) {
            console.error('The tip amount is invalid');

            throw error('The tip amount is invalid');
        }

        // Extract value preceded by '#'
        const hashtagMatch = message.match(/#(\w+)/);

        if (hashtagMatch?.[1]) {
            hashtagValue = hashtagMatch[1];
        }

        console.log('Tip Amount:', tipAmount);
        console.log('Hashtag Value:', hashtagValue);

        if (!hashtagValue) {
            console.error('Please provide a value');
            throw error('Please provide a value');
        }

        const fromFid = neynarCast.author.fid
        const fromUser = neynarCast.author
        const fromAddress = neynarCast.author.verified_addresses.eth_addresses[0]
        const fromUsername = neynarCast.author.username

        if (!fromAddress) {
            throw new Error('No verified Ethereum address found for user');
        }

        let toFid = 0

        if (neynarCast.parent_author) {
            toFid = neynarCast.parent_author.fid
        }

        if (neynarCast.mentioned_profiles[0]) {
            toFid = neynarCast.mentioned_profiles[0].fid
        }

        if (toFid == 0) {
            throw new Error('No sender details found')
        }

        const userExists = await checkUserExists(fromFid, fromAddress)

        if (userExists) {
            console.log('User already exists in the database');
            // Perform actions for existing user

            const currentAllowance = await getUserCurrentAllowance(fromAddress);

            if (currentAllowance > tipAmount) {
                const toDetails = await getUserById(toFid, fromFid)

                if (!toDetails) {
                    throw new Error('toUser details not found')
                }

                const toAddress = toDetails.verified_addresses.eth_addresses[0]
                const toUsername = toDetails.username

                const allowanceLeft = currentAllowance - tipAmount

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
                }

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

                if (!createdTransaction) {
                    console.error('Error in tip processing:', error);
                    // Here you might want to send a failure message to the user
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

        } else {
            console.log('New user detected');
            // Perform actions for new user, e.g., create a new user record
        }

    } catch (error) {
        console.error('Error in processWebhookData:', error);
    }
}


// checking if user exists in db
const checkUserExists = async (fid: number, walletAddress: string) => {
    try {
        const user = await db.user!.findUnique({
            where: {
                fid: fid,
                walletAddress
            }
        });

        return !!user;
    } catch (error) {
        console.error('Error checking if user exists:', error);
        return false;
    }
};


async function getUserCurrentAllowance(primaryAddress: string): Promise<number> {
    // Get the user's base allowance
    const allowance = await getUserAllowance(primaryAddress);

    const now = new Date();
    const from = new Date(now.setDate(now.getDate() - 7)).setHours(0, 0, 0, 0);

    // Get the sum of 'value' for transactions from this week for the primary address
    const result = await db.transaction.aggregate({
        where: {
            createdAt: {
                gte: new Date(from)
            },
            fromAddress: primaryAddress
        },
        _sum: {
            amount: true
        }
    });

    // Get the total amount given (sum of 'value')
    const totalAmountGiven = result._sum.amount || 0;

    // Calculate allowance left
    const allowanceLeft = allowance - totalAmountGiven;

    return allowanceLeft;
}

const getUserAllowance = async (wallet: string): Promise<number> => {
    const allowance: number = await stack.getPoints(wallet, { event: "allowance" });
    return allowance
    // return 10000
}

interface BotReplyResult {
    success: boolean;
    message: string;
    castHash?: string;
}

async function botReply(parentHash: string, castText: string, tipStatus: string, msg: string, main: string): Promise<BotReplyResult> {
    try {
        // Check if a reply already exists
        const existingReply = await db.botReply.findUnique({
            where: {
                parentHash: parentHash
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
            parent: parentHash,
            embeds: [
                {
                    url: `${process.env.NEXT_PUBLIC_BASE_URL}/?tipStatus=${encodeURIComponent(tipStatus)}&msg=${encodeURIComponent(msg)}&main=${encodeURIComponent(main)}`
                }
            ],
        }, { api_key: process.env.NEYNAR_API_KEY });

        const castHash = response.cast.hash;

        // Update the database
        await db.botReply.create({
            data: {
                castHash: castHash,
                parentHash: parentHash,
            }
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
