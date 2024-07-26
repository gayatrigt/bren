import { UserType } from '@prisma/client';
import { botReply, botReplyInvite, botReplywihtoutFrame } from './botReply';
import { db } from '~/server/db';
import { getUserById } from '~/server/neynar';
import { Cast } from '~/contracts/NeynarCast';
import { getStartOfWeek } from '../getUserStats';
import { setUserAllowance } from './setAllowance';
import { checkWhitelist } from './checkWhiteList';
import { CheckEligibilityAPIResponse } from '../whitelist/fbi-token';
import { fids } from '../whitelist/fids';

export async function processInvite(invitorFid: number, cast: Cast) {
    const startOfWeek = getStartOfWeek();

    // Check if invitor has a wallet address
    const invitorWalletAddress = cast.author.verified_addresses.eth_addresses[0];
    if (!invitorWalletAddress) {
        throw new Error(`Invitor ${invitorFid} does not have a verified wallet address.`);
    }

    // 1. Check if the invitor has invites left for the week
    const invitesUsed = await db.invite.count({
        where: {
            invitorFid: invitorFid,
            createdAt: { gte: startOfWeek }
        }
    });

    if (invitesUsed >= 3) {
        console.log(`Invitor ${invitorFid} has no invites left for this week.`);
        return;
    }

    let invitesLeft = 3
    const isSpecialInvitor = invitorFid === 190081 || invitorFid === 469678;

    if (!isSpecialInvitor) {
        // 1. Check if the invitor has invites left for the week
        const invitesUsed = await db.invite.count({
            where: {
                invitorFid: invitorFid,
                createdAt: { gte: startOfWeek }
            }
        });

        if (invitesUsed >= 3) {
            console.log(`Invitor ${invitorFid} has no invites left for this week.`);
            return;
        }

        invitesLeft = 3 - invitesUsed;
    }

    // 4. Process each mentioned profile
    for (const mentionedProfile of cast.mentioned_profiles) {
        console.log("🚀 ~ processInvite ~ mentionedProfile:", mentionedProfile.username)
        if (invitesLeft <= 0) break;

        const inviteeWalletAddress = mentionedProfile.verified_addresses.eth_addresses[0];
        if (!inviteeWalletAddress) {
            console.log(`Invitee ${mentionedProfile.username} does not have a verified wallet address. Skipping.`);
            continue;
        }

        if (mentionedProfile.fid === invitorFid) {
            console.log(`Invitee ${mentionedProfile.username} is the same as the invitor. Skipping.`);
            continue;
        }

        // Check if the user already exists in the database
        const existingUser = await db.user.findUnique({
            where: { fid: mentionedProfile.fid }
        });

        // const isPowerBadge = mentionedProfile.power_badge

        const result = await checkEligibility(mentionedProfile.fid);

        if (existingUser || result) {
            console.log(`User ${mentionedProfile.username} is already invited to Bren.`);
            await botReplywihtoutFrame(cast.hash, `Hey @${cast.author.username}, @${mentionedProfile.username} is already invited to Bren.`);
            continue;
        }

        if (mentionedProfile.fid === 670648) {
            console.log(`Invitee ${mentionedProfile.username} is the bot. Skipping.`);
            continue;
        }

        try {
            // 2. Create invite record and user
            const invite = await db.invite.create({
                data: {
                    inviteeFid: mentionedProfile.fid,
                    inviteeWalletAddress: mentionedProfile.verified_addresses.eth_addresses[0],
                    invitorFid: invitorFid,
                    invitorAddress: cast.author.verified_addresses.eth_addresses[0],
                    castHash: cast.hash,
                    inviteePfp: mentionedProfile.pfp_url
                }
            });

            // Use upsert instead of create to handle both new and existing users
            const newUser = await db.user.upsert({
                where: {
                    walletAddress: mentionedProfile.verified_addresses.eth_addresses[0] || ''
                },
                update: {
                    fid: mentionedProfile.fid,
                    display_name: mentionedProfile.display_name,
                    username: mentionedProfile.username,
                    pfp: mentionedProfile.pfp_url,
                    type: 'INVITED'
                },
                create: {
                    fid: mentionedProfile.fid,
                    walletAddress: mentionedProfile.verified_addresses.eth_addresses[0] || '',
                    display_name: mentionedProfile.display_name,
                    username: mentionedProfile.username,
                    pfp: mentionedProfile.pfp_url,
                    isAllowanceGiven: false,
                    type: 'INVITED'
                }
            });

            // 3. Set allowance for the new user
            let allowanceSet = false;
            try {
                await setUserAllowance(newUser.fid, newUser.walletAddress, UserType.INVITED);
                allowanceSet = true;
            } catch (error) {
                console.error(`Error setting allowance for user ${newUser.username}:`, error);
            }

            // Only send bot reply if allowance was successfully set
            if (allowanceSet) {
                // 5. Send bot reply for successful invite
                const replyText = `Hey @${cast.author.username}! You have successfully invited @${mentionedProfile.username}.`;
                await botReplyInvite(cast.hash, replyText, invitorFid, mentionedProfile.fid);
                if (!isSpecialInvitor) {
                    invitesLeft--;
                }
            }

        } catch (error) {
            console.error(`Error processing invite for user ${mentionedProfile.fid}:`, error);
        }
    }
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
        const result: CheckEligibilityAPIResponse = await response.json();

        if (result.data.TokenBalances?.TokenBalance === null) {
            console.log('User is not whitelisted');
            return false;
        } else if (result.data.TokenBalances?.TokenBalance[0]?.tokenId === '1') {
            console.log('User is whitelisted');
            return true;
        } else {
            console.log('Unexpected result from whitelist API');
            return undefined
        }
    } catch (error) {
        console.error('Error checking whitelist:', error);
        return undefined
    }
}