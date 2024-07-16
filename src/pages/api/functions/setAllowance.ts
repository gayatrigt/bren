import { UserType } from "@prisma/client";
import { db } from "~/server/db";
import { stack } from "~/server/stack";


export async function setUserAllowance(fid: number, walletAddress: string, userType: UserType): Promise<void> {
    try {
        console.log("🚀 ~ setUserAllowance ~ userType:", userType)

        // Determine allowance points based on user type
        let allowancePoints: number;
        switch (userType) {
            case UserType.ALLIES:
                allowancePoints = 500;
                break;
            case UserType.POWER_BADGE:
                allowancePoints = 300;
                break;
            case UserType.SPLITTERS:
                allowancePoints = 100;
                break;
            case UserType.INVITED:
                // Check the invite details from the database
                const invites = await db.invite.findMany({
                    where: { inviteeFid: fid },
                    orderBy: { createdAt: 'asc' }, // Order by creation date, oldest first
                    take: 1 // Take only the first invite
                });

                if (invites.length === 0) {
                    throw new Error('No invite found for this user');
                }

                const firstInvite = invites[0];

                // Fetch the invitor's information
                const invitor = await db.user.findUnique({
                    where: { fid: firstInvite?.invitorFid }
                });

                if (!invitor) {
                    throw new Error('Invitor not found');
                }

                if (invitor.type === UserType.ALLIES) {
                    allowancePoints = 50;
                } else if (invitor.type === UserType.SPLITTERS) {
                    allowancePoints = 25;
                } else {
                    throw new Error('Invalid invitor type');
                }
                break;
            case UserType.FOLLOWER:
                allowancePoints = 20;
                break;
            default:
                throw new Error('Invalid user type');
        }

        // Only proceed if there's an allowance to set
        if (allowancePoints > 0) {
            // Track allowance on Stack
            await stack.track("allowance", {
                account: walletAddress,
                points: allowancePoints
            });
            console.log('Allowance set successfully on Stack');

            // Update user in database
            const dateToday = new Date();
            await db.user.update({
                where: {
                    walletAddress: walletAddress
                },
                data: {
                    isAllowanceGiven: true,
                    allowanceGivenAt: dateToday,
                }
            });
            console.log('Database updated successfully');
        } else {
            console.log('No allowance set for this user type');
        }

    } catch (error) {
        console.error('Error setting user allowance:', error);
        throw error;
    }
}

// Usage example:
// try {
//     const userDetails = { fid: 12345, verified_addresses: { eth_addresses: ['0x...'] } };
//     await setUserAllowance(userDetails, UserType.INVITED);
//     console.log('Allowance set and database updated successfully');
// } catch (error) {
//     console.error('Failed to set allowance:', error);
// }