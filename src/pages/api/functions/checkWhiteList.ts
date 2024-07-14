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
    try {
        const response = await fetch(
            `https://api.dune.com/api/v1/query/3840675/results?limit=1000&wallet_address=${walletAddress}`,
            {
                headers: {
                    "X-Dune-API-Key": process.env.DUNE_API_KEY || "",
                },
            }
        );

        if (!response.ok) {
            console.error(`Dune API responded with status: ${response.status}`);
            return 'UNKNOWN';
        }

        const data = await response.json();

        console.log('Dune API response:', JSON.stringify(data, null, 2));

        if (!data || !data.result || !Array.isArray(data.result.rows) || data.result.rows.length === 0) {
            console.warn(`Unexpected or empty response from Dune API for wallet address: ${walletAddress}`);
            return 'UNKNOWN';
        }

        return data.result.rows[0]?.type || 'UNKNOWN';
    } catch (error) {
        console.error('Error in checkUserType:', error);
        return 'UNKNOWN';
    }
}

async function checkIfFollowsBrenChannel(fid: number): Promise<'bren' | undefined> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
        if (!baseUrl) {
            throw new Error('NEXT_PUBLIC_BASE_URL is not defined');
        }

        const url = `${baseUrl}/api/channelFollowCheck?fid=${fid}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const data: ChannelFollowCheckResponse = await response.json();

        // Check if the data structure is as expected
        if (!data?.data?.FarcasterChannelParticipants?.FarcasterChannelParticipant) {
            console.warn('Unexpected data structure:', data);
            return undefined;
        }

        const participant = data.data.FarcasterChannelParticipants.FarcasterChannelParticipant[0];
        return participant?.channelName === 'bren' ? 'bren' : undefined;

    } catch (error) {
        console.error('Error in checkIfFollowsBrenChannel function:', error);
        // Depending on your error handling strategy, you might want to rethrow the error
        // or return undefined as you're currently doing
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