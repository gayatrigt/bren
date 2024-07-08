import { error } from "console";
import { Cast, Root } from "~/contracts/NeynarCast";
import { db } from "~/server/db";
import { getUserById } from "~/server/neynar";
import { stack } from "~/server/stack";
import { processTip } from "./functions/processtip";
import { checkWhitelist } from "./functions/checkWhiteList";
import { botReply } from "./functions/botReply";
import { setUserAllowance } from "./functions/setAllowance";


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

        const isInviteMessage = /\binvite\b/i.test(message);

        if (!isInviteMessage) {
            // Handle invite logic here
            console.log("This is not an invite message");
            // You might want to return early or set a flag to skip tip processing
            return; // Uncomment this if you want to exit the function for invite messages
        }

        const fromFid = neynarCast.author.fid
        const fromAddress = neynarCast.author.verified_addresses.eth_addresses[0]
        const fromUsername = neynarCast.author.username

        if (!fromAddress) {
            throw new Error('No verified Ethereum address found for user');
        }

        const userExists = await checkUserExists(fromFid, fromAddress)

        if (userExists) {
            console.log('User already exists in the database');
            // Perform actions for existing user


        } else {
            console.log('New user detected');
            // Perform actions for new user, e.g., create a new user record

            const isPowerBadge = neynarCast.author.power_badge

            const result = await checkWhitelist(fromFid, fromAddress, isPowerBadge);

            if (result === 'NOT_WHITELISTED') {
                console.log('User is not whitelisted');

                const result = await botReply(
                    castHash,
                    `Hey ${fromUsername}! You are not eligible to invite a Bren`,
                    `You are not eligible to invite a Bren`
                );

                if (result.success) {
                    console.log('Reply posted successfully:', result.castHash);
                } else {
                    console.error('Failed to post reply:', result.message);
                }

            } if (result === 'FOLLOWER' || result === 'INVITED' || result === 'POWER_BADGE') {
                console.log('User cannot invite');

                const result = await botReply(
                    castHash,
                    `Hey ${fromUsername}! You are not eligible to invite a Bren. Only Build committers can invite.`,
                    `You are not eligible to invite a Bren`
                );

                if (result.success) {
                    console.log('Reply posted successfully:', result.castHash);
                } else {
                    console.error('Failed to post reply:', result.message);
                }
            }
            else if (result === 'ALLIES' || result === 'SPLITTERS') {
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
    const allowance: number = await stack.getPoints(wallet);
    return allowance
    // return 10000
}