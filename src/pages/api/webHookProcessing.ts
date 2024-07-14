import { error } from "console";
import { Cast, Root } from "~/contracts/NeynarCast";
import { db } from "~/server/db";
import { getUserById } from "~/server/neynar";
import { stack } from "~/server/stack";
import { processTip } from "./functions/processtip";
import { checkWhitelist } from "./functions/checkWhiteList";
import { botReply } from "./functions/botReply";
import { setUserAllowance } from "./functions/setAllowance";
import { getStartOfWeek } from "./getUserStats";

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

        const amountFromText = message.match(/\$?\s*(\d+)\s*\$?\s*bren\b/i);

        if (amountFromText?.[1]) {
            tipAmount = parseInt(amountFromText?.[1]
                .replace(/\$/, '')
            );
        }

        console.log('Tip Amount:', tipAmount);

        if (!tipAmount) {
            console.error('The tip amount is invalid');

            throw new Error('The tip amount is invalid');
        }

        // Extract value preceded by '#'
        const hashtagMatch = message.match(/#(\w+)/);

        if (hashtagMatch?.[1]) {
            hashtagValue = hashtagMatch[1];
        }

        console.log('Hashtag Value:', hashtagValue);

        // if (!hashtagValue) {
        //     console.error('Please provide a value');
        //     throw new Error('Please provide a value');
        // }

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
            const allowanceLeft = currentAllowance - tipAmount;
            console.log(`Current Allowance: ${currentAllowance}, Allowance Left: ${allowanceLeft}`);

            await processTip(
                tipAmount,
                currentAllowance,
                fromFid,
                fromAddress,
                fromUsername,
                toFid,
                message,
                hashtagValue,
                castHash,
                neynarCast
            );

        } else {
            console.log('New user detected');
            // Perform actions for new user, e.g., create a new user record

            const isPowerBadge = neynarCast.author.power_badge

            const result = await checkWhitelist(fromFid, fromAddress, isPowerBadge);

            if (result === 'NOT_WHITELISTED') {
                console.log('User is not whitelisted');

                const result = await botReply(
                    castHash,
                    `Hey ${fromUsername}! You are not eligible to tip $bren`,
                    `Your tip failed as you are not eligible`
                );

                if (result.success) {
                    console.log('Reply posted successfully:', result.castHash);
                } else {
                    console.error('Failed to post reply:', result.message);
                }

            } else {
                console.log(`User is whitelisted as ${result}`);

                try {
                    const newUser = await db.user.create({
                        data: {
                            walletAddress: fromAddress,
                            fid: fromFid,
                            display_name: neynarCast.author.display_name,
                            username: fromUsername,
                            pfp: neynarCast.author.pfp_url,
                            isAllowanceGiven: false,
                            type: result
                        },
                    });

                    console.log(`New user created successfully. FID: ${fromFid}`);

                } catch (error) {
                    console.error(`Error creating new user. FID: ${fromFid}`, error);
                }

                try {
                    await setUserAllowance(fromFid, fromAddress, result);
                    console.log('Allowance set and database updated successfully');
                } catch (error) {
                    console.error('Failed to set allowance:', error);
                }

                const currentAllowance = await getUserCurrentAllowance(fromAddress);

                await processTip(
                    tipAmount,
                    currentAllowance,
                    fromFid,
                    fromAddress,
                    fromUsername,
                    toFid,
                    message,
                    hashtagValue,
                    castHash,
                    neynarCast
                );

            }
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

    // Get the start of the current week
    const startOfWeek = getStartOfWeek();

    // Get the sum of 'value' for transactions from the start of this week for the primary address
    const result = await db.transaction.aggregate({
        where: {
            createdAt: {
                gte: startOfWeek
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
    const allowance: number = await stack.getPoints(wallet);
    return allowance
    // return 10000
}