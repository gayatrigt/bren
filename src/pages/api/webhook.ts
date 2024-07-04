import { UserType } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { NeynarWebhook } from '~/contracts/NeynarWebhook';
import { db } from '~/server/db';
import { getUserById } from '~/server/neynar';
import { stack } from '~/server/stack';
const sdk = require('api')('@neynar/v2.0#281yklumre2o7');

// add body-parser to parse the request body
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
    },
}

interface ChannelFollowCheckResponse {
    data: {
        FarcasterChannelParticipants: {
            FarcasterChannelParticipant: { channelName: string }[] | null;
        };
    };
}


// replying to casts
const reply = async (parentHash: string, castText: string, tipStatus: string, msg: string, main: string): Promise<string> => {

    const response = await sdk.postCast({
        signer_uuid: process.env.SIGNER_UUID,
        text: castText,
        parent: parentHash,
        embeds: [
            {
                url: `${process.env.NEXT_PUBLIC_BASE_URL}/?tipStatus=${tipStatus}&msg=${msg}&main=${main}`
            }
        ],
    }, { api_key: process.env.NEYNAR_API_KEY })

    const castHash = response.cast.hash

    await db.botReply.create({
        data: {
            castHash: castHash,
            parentHash: parentHash,
        }
    })
    return castHash
}

// checking if a bot reply already exists !
const checkBotReply = async (parentHash: string): Promise<boolean> => {
    try {
        const existingReply = await db.botReply.findUnique({
            where: {
                parentHash: parentHash
            }
        });

        return existingReply !== null;
    } catch (error) {
        console.error('Error checking bot reply:', error);
        // In case of an error, we return false to be safe
        return false;
    }
}

const checkIfFollowsBrenChannel = async (fid: number): Promise<'bren' | undefined> => {
    try {
        const response = await fetch(`/api/channelFollowCheck?fid=${fid}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data: ChannelFollowCheckResponse = await response.json();

        const participant = data.data.FarcasterChannelParticipants.FarcasterChannelParticipant?.[0];
        return participant?.channelName === 'bren' ? 'bren' : undefined;

    } catch (err) {
        console.error('Error: Failed to fetch channel follow status', err);
        return undefined; // Return undefined in case of error
    }
};


// checking if user exists in db
const checkUserExists = async (fid: number, body: NeynarWebhook) => {
    try {
        const user = await db.user!.findUnique({
            where: {
                fid: fid,
                walletAddress: body.data.author.verified_addresses.eth_addresses[0]
            }
        });

        return !!user;
    } catch (error) {
        console.error('Error checking if user exists:', error);
        return false;
    }
};

// checking if a user is a splitter or allies 
const checkUserType = async (body: NeynarWebhook) => {
    const response = await fetch(
        `https://api.dune.com/api/v1/query/3840675/results?limit=1000&wallet_address=${body.data.author.verified_addresses.eth_addresses[0]}`,
        {
            headers: {
                "X-Dune-API-Key": process.env.DUNE_API_KEY!,
            },
        }
    );
    const data = await response.json();
    const type = data.result.rows[0].type
    return type
}

const createNewUser = async (body: NeynarWebhook, type?: string, follow?: boolean) => {
    try {

        let finalType: UserType | undefined;

        if (type === 'splitter') {
            finalType = UserType.SPLITTERS;
        } else if (type === 'payItForward') {
            finalType = UserType.ALLIES;
        } else if (body.data.author.power_badge) {
            finalType = UserType.POWER_BADGE;
        } else if (follow) {
            finalType = UserType.FOLLOWER;
        }

        if (!finalType) {
            throw new Error('Invalid user type');
        }

        const newUser = await db.user.create({
            data: {
                walletAddress: body.data.author.verified_addresses.eth_addresses[0]!,
                fid: body.data.author.fid,
                display_name: body.data.author.display_name,
                username: body.data.author.username,
                pfp: body.data.author.pfp_url,
                isAllowanceGiven: false,
                type: finalType
            },
        });

        console.log('New user created:', newUser);

    } catch (err) {
        console.log('Error creating new user', err);
    }
}

const setAllowance = async (fid: number, isSplitter: boolean, isAllies: boolean, isFollowingBren: boolean) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const endpoint = `/api/checkEligibility`;
    const fullUrl = `${baseUrl}${endpoint}?fid=${fid}&isSplitter=${isSplitter}&isAllies=${isAllies}&isFollowingChannel=${isFollowingBren}`;
    const setAllowance = await fetch(fullUrl, {
        method: "GET",
    })

    console.log(setAllowance);
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        console.error('Method Not Allowed')
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Handle the POST request here
    // You can access the request body using req.body
    const body = req.body as NeynarWebhook;

    if (!body || !body.data) {
        console.error('Invalid request body', JSON.stringify(body.data, null, 2));
        return res.status(400).json({ message: 'Invalid request body' });
    }

    // grab the text from the message
    const message = body.data.text;

    // returning message: bot is not allowed to tip if req is being sent by bot
    const botFid = 600098
    if (body.data.author.fid === botFid) {
        console.error('Own Bot is not allowed to tip');
        return res.status(200).json({ message: 'Own Bot is not allowed to tip' });
    }

    const isReplyAlreadyExists = await checkBotReply(body.data.hash)

    if (!!isReplyAlreadyExists) {
        return res.status(200).json({ message: 'Already replied' });
    }


    // if the user is following bren channel
    // if (!isFollowingBren) {
    //     console.error('User not following bren.');

    //     // casting reply that tip amt is invalid
    //     const castMessage = `Hey ${body.data.author.username}!\nPlease follow $bren to tip someone.`
    //     const isReplyAlreadyExists = await checkBotReply()

    //     if (!isReplyAlreadyExists) {
    //         await reply(body.data.hash, castMessage, encodeURIComponent(""), encodeURIComponent("You are not following $bren!"), encodeURIComponent("Please Follow $Bren to tip ."))
    //         console.log('cast created');
    //     }

    //     return res.status(400).json({ isFollowingBren, message: 'Follow Bren channel to tip' });
    // }

    const isUserExists = await checkUserExists(body.data.author.fid, body)

    // calling func to create new user
    if (!isUserExists) {
        // getting user type - splitter or payItForward

        const userType = await checkUserType(body)
        const isSplitter = userType === 'splitter' ? true : false
        const isAllies = userType === 'payItForward' ? true : false
        const follow = await checkIfFollowsBrenChannel(body.data.author.fid)
        const isFollowingBren = follow === 'bren' ? true : false
        console.log("🚀 ~ handler ~ isFollowingBren:", isFollowingBren)

        // since only user with either power badge or being a splitter or being an allie(payItForward) 
        if (!isAllies && !isSplitter && !body.data.author.power_badge && !isFollowingBren) {
            console.error('You are not eligible to tip');

            // casting reply that tip amt is invalid
            const castMessage = `Hey ${body.data.author.username}!\You are not eligible to tip $bren.`
            const isReplyAlreadyExists = await checkBotReply(body.data.hash)

            if (!isReplyAlreadyExists) {
                const castHash = await reply(body.data.hash, castMessage, encodeURIComponent("Not Eligible"), encodeURIComponent("You are not eligible to tip!"), encodeURIComponent("Please be splitter/payItForward/powerBadgeHolder to tip ."))
                await db.botReply.create({ data: { parentHash: body.data.hash, castHash } })
            }

            return res.status(400).json({ message: 'Not ELigible to tip' });
        }

        await createNewUser(body, userType, isFollowingBren)

        // setting allowance points for a user if it's not set or user is tipping for first time
        await setAllowance(body.data.author.fid, isSplitter, isAllies, isFollowingBren)

        console.log({
            fid: body.data.author.fid,
            isFollowingChannel: isFollowingBren,
            isSplitter: isSplitter,
            isAllies: isAllies
        });
    }

    // check for eth address
    const senderEthAddress = body.data.author.verified_addresses.eth_addresses[0];
    if (!senderEthAddress) {
        console.error('You have not verified your eth address');
        return res.status(200).json({ message: 'You have not verified your eth address' });
    }

    let recipientFid: number | undefined;

    if (!!body.data.parent_author.fid) {
        recipientFid = body.data.parent_author.fid
    }

    if (!!body.data.mentioned_profiles[0]?.fid) {
        recipientFid = body.data.mentioned_profiles[0]?.fid
    }

    if (recipientFid === body.data.author.fid) {
        console.error('You cannot tip yourself');
        return res.status(200).json({ message: 'You cannot tip yourself' });
    }

    if (!recipientFid) {
        console.error('No recipient, ignored');
        return res.status(201).json({ message: 'No recipient, ignored' });
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

    // Extract value preceded by '#'
    const hashtagMatch = message.match(/#(\w+)/);

    if (hashtagMatch?.[1]) {
        hashtagValue = hashtagMatch[1];
    }

    console.log('Tip Amount:', tipAmount);
    console.log('Hashtag Value:', hashtagValue);

    if (!tipAmount) {
        console.error('The tip amount is invalid');

        // casting reply that tip amt is invalid
        const castMessage = `Hey ${body.data.author.username}!\nThe tip amount entered is invalid! Please enter a valid amount.`
        const isReplyAlreadyExists = await checkBotReply(body.data.hash)

        if (!isReplyAlreadyExists) {
            await reply(body.data.hash, castMessage, encodeURIComponent("Amount Invalid"), encodeURIComponent("The tip amount entered is invalid!"), encodeURIComponent("Please enter a valid amount."))
            console.log('cast created');
        }

        return res.status(200).json({ tipAmount, message: 'The tip amount is invalid' });
    }

    if (!hashtagValue) {
        console.error('No value provided');

        // casting reply that tip amt is invalid
        const castMessage = `Hey ${body.data.author.username}!\nPlease tip with a value.`
        const isReplyAlreadyExists = await checkBotReply(body.data.hash)

        if (!isReplyAlreadyExists) {
            await reply(body.data.hash, castMessage, encodeURIComponent("Value Invalid"), encodeURIComponent("Please tip with a value!"), encodeURIComponent("Please tip with a value."))
            console.log('cast created');
        }

        return res.status(200).json({ tipAmount, message: 'Please tip with a value' });
    }

    // check the user allowance 
    const primaryAddress = body.data.author.verified_addresses.eth_addresses[0]
    if (!primaryAddress) {
        console.error('You have not verified your eth address');
        return res.status(200).json({ message: 'You have not verified your eth address' });
    }

    const allowance = await getUserAllowance(primaryAddress);

    const now = new Date();
    const from = new Date(now.setDate(now.getDate() - 7)).setHours(0, 0, 0, 0);
    // get transactions from this week using prisma
    const transactions = await db.transaction.findMany({
        where: {
            createdAt: {
                gte: new Date(from)
            },
            fromAddress: {
                in: body.data.author.verified_addresses.eth_addresses
            }
        }
    });

    // get the total amount of the transactions
    const totalAmount = transactions.reduce((acc, cur) => acc + cur.amount, 0);
    // allowance left
    const allowanceLeft = allowance - (totalAmount + tipAmount)

    // check if the user has enough allowance
    if (totalAmount + tipAmount > allowance) {
        console.error('You have reached your daily allowance');

        // casting reply that user has reached daily allowance
        const castMessage = `Hey ${body.data.author.username}!\nYou have reached your daily allowance. Please come tomorrow to tip.`
        const isReplyAlreadyExists = await checkBotReply(body.data.hash)

        if (!isReplyAlreadyExists) {
            await reply(body.data.hash, castMessage, encodeURIComponent("TIP FAILED"), encodeURIComponent("Looks like you have exceeded your daily tip allowance."), encodeURIComponent(`You can only tip $${allowanceLeft < 0 ? 0 : allowanceLeft}`))
            console.log('cast created');

        }

        return res.status(200).json({ message: 'You have reached your daily allowance' });
    }

    const recipientDetails = await getUserById(recipientFid.toString(), body.data.author.fid.toString())

    if (!recipientDetails) {
        return res.status(200).json({ message: 'Enter a valid recipient' });
    }

    if (recipientDetails.verified_addresses.eth_addresses[0] === undefined) {
        throw new Error('Recipient Ethereum address is required');
    }

    const data = {
        amount: tipAmount,
        fromFid: body.data.author.fid,
        fromAddress: senderEthAddress,
        fromUsername: body.data.author.username,
        toUsername: recipientDetails.username,
        toFid: recipientFid,
        toAddress: recipientDetails.verified_addresses.eth_addresses[0],
        text: message,
        value: hashtagValue,
        castHash: body.data.hash,
        parentCastHash: body.data.parent_hash ? body.data.parent_hash : null,
        link: `https://warpcast.com/${body.data.author.username}/${body.data.hash}`,
    }

    // casting a reply to the user that the tip has been sent
    const castMessage = `Hey ${body.data.author.username}!\nYou have successfully tipped ${tipAmount} $bren to ${data.toUsername}.\nAllowance left : ${allowanceLeft < 0 ? 0 : allowanceLeft} $bren`
    await reply(body.data.hash, castMessage, encodeURIComponent("Tip Successfull"), "", encodeURIComponent(`You have successfully tipped ${tipAmount} $bren`))

    console.log('success');

    await db.transaction.create({ data });

    // send a message to the user that the tip has been sent
    return res.status(200).json({ data, message: 'Received POST request' });

}

const getUserAllowance = async (wallet: string): Promise<number> => {
    const allowance: number = await stack.getPoints(wallet, { event: "allowance" });
    return allowance
    // return 10000
}