import { UserType } from '@prisma/client';
import { botReply } from './botReply';
import { db } from '~/server/db';
import { getUserById } from '~/server/neynar';
import { Cast } from '~/contracts/NeynarCast';
import { getStartOfWeek } from '../getUserStats';
import { setUserAllowance } from './setAllowance';

async function processInvite(invitorFid: number, cast: Cast) {
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

    let invitesLeft = 3 - invitesUsed;

    // 4. Process each mentioned profile
    for (const mentionedProfile of cast.mentioned_profiles) {
        if (invitesLeft <= 0) break;

        const inviteeWalletAddress = mentionedProfile.verified_addresses.eth_addresses[0];
        if (!inviteeWalletAddress) {
            console.log(`Invitee ${mentionedProfile.fid} does not have a verified wallet address. Skipping.`);
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
                    castHash: cast.hash
                }
            });

            const newUser = await db.user.create({
                data: {
                    fid: mentionedProfile.fid,
                    walletAddress: mentionedProfile.verified_addresses.eth_addresses[0] || '',
                    display_name: mentionedProfile.display_name,
                    username: mentionedProfile.username,
                    pfp: mentionedProfile.pfp_url,
                    isAllowanceGiven: false,
                    type: UserType.INVITED
                }
            });

            // 3. Set allowance for the new user
            await setUserAllowance(newUser.fid, newUser.walletAddress, UserType.INVITED);

            // 5. Send bot reply for successful invite
            const replyText = `Hey ${cast.author.username}! You have successfully invited @${mentionedProfile.username}.`;
            await botReply(cast.hash, replyText, "Invite Successful");

            invitesLeft--;

        } catch (error) {
            console.error(`Error processing invite for user ${mentionedProfile.fid}:`, error);
        }
    }

    if (invitesLeft < 3 - invitesUsed) {
        const invitedCount = 3 - invitesUsed - invitesLeft;
        const finalReply = `You have successfully invited ${invitedCount} user${invitedCount > 1 ? 's' : ''}. You have ${invitesLeft} invite${invitesLeft !== 1 ? 's' : ''} left for this week.`;
        await botReply(cast.hash, finalReply, "Invite Summary");
    }
}