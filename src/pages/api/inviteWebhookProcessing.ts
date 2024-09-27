import { error } from "console";
import { Cast, Root } from "~/contracts/NeynarCast";
import { db } from "~/server/db";
import { getUserById } from "~/server/neynar";
import { stack } from "~/server/stack";
import { processTip } from "./functions/processtip";
import { checkWhitelist } from "./functions/checkWhiteList";
import { botReply } from "./functions/botReply";
import { setUserAllowance } from "./functions/setAllowance";
import { processInvite } from "./functions/processInvite";
import { fids } from "./whitelist/fids";


export async function processinviteWebhookData(hash: string) {
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

            const user = await db.user.findUnique({
                where: { fid: fromFid },
            });

            if (!user) {
                throw new Error('User not found in the database');
            }

            if (user) {
                console.log(`User can invite`);

                // Perform actions for users who can invite
                try {
                    const inviteResult = await processInvite(fromFid, neynarCast);
                    console.log('Invite processed successfully');

                    // You can add more specific success handling here if needed
                } catch (error) {
                    console.error('Error processing invite:', error);

                    // Determine the error message to send back to the user
                    let errorMessage = 'An error occurred while processing your invite.';
                    if (error instanceof Error) {
                        if (error.message.includes('no invites left')) {
                            errorMessage = `Hey ${fromUsername}! You've used all your invites for this week.`;
                        } else if (error.message.includes('does not have a verified wallet address')) {
                            errorMessage = `Hey ${fromUsername}! There was an issue with the wallet address. Please make sure all mentioned users have verified wallet addresses.`;
                        }
                        // Add more specific error cases as needed
                    }

                    // Send error message back to the user
                    try {
                        const result = await botReply(
                            castHash,
                            errorMessage,
                            'Invite Processing Error'
                        );

                        if (result.success) {
                            console.log('Error reply posted successfully:', result.castHash);
                        } else {
                            console.error('Failed to post error reply:', result.message);
                        }
                    } catch (replyError) {
                        console.error('Error sending bot reply:', replyError);
                    }
                }

            } else if (!user) {
                console.log('New user detected');
                // Perform actions for new user, e.g., create a new user record

                // const isPowerBadge = neynarCast.author.power_badge

                // const result = await checkWhitelist(fromFid, fromAddress, isPowerBadge);

                const result = await checkEligibility(fromFid);

                if (!result) {
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
                }

                // } if (result) {
                //     console.log('User cannot invite');

                //     const result = await botReply(
                //         castHash,
                //         `Hey ${fromUsername}! You are not eligible to invite a Bren. Only Build committers can invite.`,
                //         `You are not eligible to invite a Bren`
                //     );

                //     if (result.success) {
                //         console.log('Reply posted successfully:', result.castHash);
                //     } else {
                //         console.error('Failed to post reply:', result.message);
                //     }
                // }
                else if (result) {
                    console.log(`User is whitelisted as ${result}`);

                    try {
                        const newUser = await db.user.create({
                            data: {
                                walletAddress: fromAddress,
                                isAllowanceGiven: false,
                                farcasterDetails: {
                                    create: {
                                        fid: fromFid,
                                        display_name: neynarCast.author.display_name,
                                        username: fromUsername,
                                        pfp: neynarCast.author.pfp_url,
                                        type: 'WHITELISTED'
                                    }
                                }
                            },
                            include: {
                                farcasterDetails: true
                            }
                        });

                        console.log(`New user created successfully. FID: ${fromFid}`);

                        try {
                            await setUserAllowance(fromFid, fromAddress, 'WHITELISTED');
                            console.log('Allowance set and database updated successfully');

                            // Perform actions for users who can invite
                            try {
                                const inviteResult = await processInvite(fromFid, neynarCast);
                                console.log('Invite processed successfully');

                                // You can add more specific success handling here if needed
                            } catch (error) {
                                console.error('Error processing invite:', error);

                                // Determine the error message to send back to the user
                                let errorMessage = 'An error occurred while processing your invite.';
                                if (error instanceof Error) {
                                    if (error.message.includes('no invites left')) {
                                        errorMessage = `Hey @${fromUsername}! You've used all your invites for this week.`;
                                    } else if (error.message.includes('does not have a verified wallet address')) {
                                        errorMessage = `Hey @${fromUsername}! There was an issue with the wallet address. Please make sure all mentioned users have verified wallet addresses.`;
                                    }
                                    // Add more specific error cases as needed
                                }

                                // Send error message back to the user
                                try {
                                    const result = await botReply(
                                        castHash,
                                        errorMessage,
                                        'Invite Processing Error'
                                    );

                                    if (result.success) {
                                        console.log('Error reply posted successfully:', result.castHash);
                                    } else {
                                        console.error('Failed to post error reply:', result.message);
                                    }
                                } catch (replyError) {
                                    console.error('Error sending bot reply:', replyError);
                                }
                            }
                        } catch (error) {
                            console.error('Failed to set allowance:', error);
                        }

                    } catch (error) {
                        console.error(`Error creating new user. FID: ${fromFid}`, error);
                    }


                }
            }

        }
        // Add this closing brace to properly close the try block
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