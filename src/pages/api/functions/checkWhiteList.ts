import { UserType } from "@prisma/client";
import { db } from "~/server/db";

interface NeynarWebhook {
    data: {
        author: {
            verified_addresses: {
                eth_addresses: string[];
            };
            power_badge: boolean;
            fid: number;
        };
    };
}

interface ChannelFollowCheckResponse {
    data: {
        FarcasterChannelParticipants: {
            FarcasterChannelParticipant: { channelName: string }[] | null;
        };
    };
}

async function checkWhitelist(fid: number, walletAddress: string, isPowerBadge: boolean): Promise<UserType | 'NOT_WHITELISTED'> {
    try {
        // 1. Check if user is splitter or payitforward
        const userType = await checkUserType(walletAddress);
        if (userType === 'splitter') {
            return UserType.SPLITTERS;
        } else if (userType === 'payItForward') {
            return UserType.ALLIES;
        }

        // 2. Check if power badge holder
        const isPowerBadgeHolder = isPowerBadge
        if (isPowerBadgeHolder) {
            return UserType.POWER_BADGE;
        }

        // 3. Check if follows bren
        const followsBren = await checkIfFollowsBrenChannel(fid);
        if (followsBren === 'bren') {
            return UserType.FOLLOWER;
        }

        // 4. Check if invited in database
        const isInvited = await checkIfInvited(fid, walletAddress);
        if (isInvited) {
            return UserType.INVITED;
        }

        // 5. If none of the above, return not whitelisted
        return 'NOT_WHITELISTED';

    } catch (error) {
        console.error('Error in checkWhitelist:', error);
        throw error;
    }
}

async function checkUserType(walletAddress: string): Promise<string> {
    const response = await fetch(
        `https://api.dune.com/api/v1/query/3840675/results?limit=1000&wallet_address=${walletAddress}`,
        {
            headers: {
                "X-Dune-API-Key": process.env.DUNE_API_KEY!,
            },
        }
    );
    const data = await response.json();
    return data.result.rows[0]?.type || 'UNKNOWN';
}

async function checkIfFollowsBrenChannel(fid: number): Promise<'bren' | undefined> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/channelFollowCheck?fid=${fid}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data: ChannelFollowCheckResponse = await response.json();

        const participant = data.data.FarcasterChannelParticipants.FarcasterChannelParticipant?.[0];
        return participant?.channelName === 'bren' ? 'bren' : undefined;

    } catch (err) {
        console.error('Error: Failed to fetch channel follow status', err);
        return undefined;
    }
}

async function checkIfInvited(fid: number, walletAddress: string): Promise<boolean> {
    const invite = await db.invite.findFirst({
        where: {
            OR: [
                { inviteeFid: fid },
                { inviteeWalletAddress: walletAddress }
            ]
        }
    });

    return !!invite;
}

export { checkWhitelist };