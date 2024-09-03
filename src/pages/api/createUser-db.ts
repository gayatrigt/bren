import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { db } from '~/server/db';
import { NeynarUser } from '~/contracts/NeynarUser';
import { setUserAllowance } from './functions/setAllowance';
import { env } from '~/env';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fid } = req.query;

    if (!fid || Array.isArray(fid)) {
        return res.status(400).json({ error: 'Missing or invalid fid parameter' });
    }

    const fidNumber = parseInt(fid, 10);

    if (isNaN(fidNumber)) {
        return res.status(400).json({ error: 'Invalid fid parameter' });
    }

    try {
        // Fetch user details from Neynar
        const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
            headers: {
                'accept': 'application/json',
                'api_key': env.NEYNAR_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user details from Neynar');
        }

        const data: NeynarUser = await response.json();
        const user = data.users[0]

        if (user) {
            // Create user in the database
            const newUser = await db.user.create({
                data: {
                    walletAddress: user.verified_addresses.eth_addresses[0],
                    isAllowanceGiven: false,
                    farcasterDetails: {
                        create: {
                            fid: user.fid,
                            display_name: user.display_name,
                            username: user.username,
                            pfp: user.pfp_url,
                            type: 'WHITELISTED'
                        }
                    }
                },
                include: {
                    farcasterDetails: true
                }
            });
            console.log(`New user created successfully. FID: ${newUser.fid}`);

            res.status(200).json({
                message: 'User created successfully',
                user: newUser
            });

            try {
                await setUserAllowance(newUser.fid, newUser.walletAddress, 'WHITELISTED');
                console.log('Allowance set and database updated successfully');
            } catch (error) {
                console.error('Failed to set allowance:', error);
            }
        }

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}