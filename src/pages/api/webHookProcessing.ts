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
import { fids } from "./whitelist/fids";
import { use } from "react";

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

        const toFid = await getRecipientFid(neynarCast);

        if (!toFid) {
            throw new Error('No sender details found')
        }

        const userExists = await checkUserExists(fromFid, fromAddress)

        if (userExists) {
            console.log('User already exists in the database');
            // Perform actions for existing user

            const userFC = await db.user.update({
                where: {
                    walletAddress: fromAddress
                },
                data: {
                    fid: fromFid,

                },
                select: {
                    id: true,
                }
            })

            await db.farcasterDetails.update({
                where: {
                    userId: userFC.id
                },
                data: {
                    fid: fromFid,
                    username: fromUsername,
                    pfp: neynarCast.author.pfp_url,
                    display_name: neynarCast.author.display_name
                }
            })

            const currentAllowance = await getUserCurrentAllowanceByWalletAddress(fromAddress);
            if (currentAllowance === undefined) {
                console.error(`Unable to retrieve current allowance for wallet address: ${fromAddress}`);
                // Handle the error case, perhaps by sending a message to the user or logging it
                return; // or throw an error, or handle it in some other way
            }

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

        }

        else if (!userExists) {
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
                            isAllowanceGiven: false,
                            farcasterDetails: {
                                create: {
                                    fid: fromFid,
                                    display_name: neynarCast.author.display_name,
                                    username: fromUsername,
                                    pfp: neynarCast.author.pfp_url,
                                    type: result
                                }
                            }
                        },
                        include: {
                            farcasterDetails: true
                        }
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

                const currentAllowance = await getUserCurrentAllowanceByWalletAddress(fromAddress);

                if (currentAllowance === undefined) {
                    console.error(`Unable to retrieve current allowance for wallet address: ${fromAddress}`);
                    // Handle the error case, perhaps by sending a message to the user or logging it
                    return; // or throw an error, or handle it in some other way
                }

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

        // else {
        //     console.log('New user detected');
        //     // Perform actions for new user, e.g., create a new user record

        //     const result = await checkEligibility(fromFid);

        //     if (!result) {
        //         console.log('User is not whitelisted');

        //         const result = await botReply(
        //             castHash,
        //             `Hey ${fromUsername}! You are not eligible to tip $bren`,
        //             `Your tip failed as you are not eligible`
        //         );

        //         if (result.success) {
        //             console.log('Reply posted successfully:', result.castHash);
        //         } else {
        //             console.error('Failed to post reply:', result.message);
        //         }

        //     } else if (result) {
        //         console.log(`User is whitelisted as ${result}`);

        //         try {
        //             const newUser = await db.user.create({
        //                 data: {
        //                     walletAddress: fromAddress,
        //                     fid: fromFid,
        //                     display_name: neynarCast.author.display_name,
        //                     username: fromUsername,
        //                     pfp: neynarCast.author.pfp_url,
        //                     isAllowanceGiven: false,
        //                     type: 'WHITELISTED'
        //                 },
        //             });

        //             console.log(`New user created successfully. FID: ${fromFid}`);

        //         } catch (error) {
        //             console.error(`Error creating new user. FID: ${fromFid}`, error);
        //         }

        //         try {
        //             await setUserAllowance(fromFid, fromAddress, 'WHITELISTED');
        //             console.log('Allowance set and database updated successfully');
        //         } catch (error) {
        //             console.error('Failed to set allowance:', error);
        //         }

        //         const currentAllowance = await getUserCurrentAllowance(fromAddress);

        //         await processTip(
        //             tipAmount,
        //             currentAllowance,
        //             fromFid,
        //             fromAddress,
        //             fromUsername,
        //             toFid,
        //             message,
        //             hashtagValue,
        //             castHash,
        //             neynarCast
        //         );

        //     }
        // }

    } catch (error) {
        console.error('Error in processWebhookData:', error);
    }
}


// checking if user exists in db
const checkUserExists = async (fid: number, walletAddress: string) => {
    try {
        const user = await db.user.findUnique({
            where: {
                walletAddress: walletAddress
            },
            include: {
                farcasterDetails: true
            }
        });

        if (user && user.walletAddress !== walletAddress) {
            throw new Error("Wallet address mismatch");
        }

        return !!user;
    } catch (error) {
        console.error('Error checking if user exists:', error);
        return false;
    }
};

async function getUserCurrentAllowanceByWalletAddress(walletAddress: string): Promise<number | undefined> {
    const user = await db.user.findUnique({ where: { walletAddress } });
    if (!user) throw new Error('User not found');
    return getUserCurrentAllowance(user.walletAddress, user.id);
}

async function getUserCurrentAllowance(wallet: string | null, userId: string): Promise<number | undefined> {
    if (!wallet) {
        console.log("Wallet not connected")
        return undefined
    }

    // Get the user's base allowance
    const allowance = await getUserAllowance(wallet);

    // Get the start of the current week
    const startOfWeek = getStartOfWeek();

    // Get the sum of 'amount' for transactions from the start of this week for the user
    const result = await db.transaction.aggregate({
        where: {
            createdAt: {
                gte: startOfWeek
            },
            fromUserId: userId
        },
        _sum: {
            amount: true
        }
    });

    // Get the total amount given (sum of 'amount')
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

async function getRecipientFid(neynarCast: Cast): Promise<number> {

    // First, check for parent author
    if (neynarCast.parent_author?.fid) {
        return neynarCast.parent_author.fid;
    }

    if (!!neynarCast.mentioned_profiles.length) {
        // If no parent author, check mentioned profiles
        const profiles = neynarCast.mentioned_profiles.filter(p => p.fid !== 670648)

        if (!!profiles[0]?.fid) {
            return profiles[0]?.fid
        }
    }

    // If we reach here, no valid recipient was found
    throw new Error('No valid recipient found: neither parent author nor suitable mentioned profiles');
}

async function checkEligibility(fromFid: number): Promise<boolean | undefined> {
    console.log('Checking eligibility for FID:', fromFid);

    // First, check if the FID exists in the fids object
    if (fids.includes(fromFid)) {
        console.log('FID found in local database');
        return true
    }

    console.log('FID not found in local database, checking whitelist API');

    // If not in fids object, call the local API
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/whitelist/fbi-token?fid=${fromFid}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.isWhitelisted === true) {
            console.log('User is whitelisted');
            return true;
        } else if (result.isWhitelisted === false) {
            console.log('User is not whitelisted');
            return false;
        } else {
            console.log('Unexpected result from whitelist API');
            return undefined;
        }
    } catch (error) {
        console.error('Error checking whitelist:', error);
        return undefined;
    }
}