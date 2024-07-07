const sdk = require('api')('@neynar/v2.0#281yklumre2o7');

export const getUserById = async (fid: number): Promise<User | null | undefined> => {
    try {
        const response: GetUserByIdResponse = await sdk.userBulk({ fids: [fid], api_key: process.env.NEYNAR_API_KEY })
        return response.data.users[0]
    } catch (error) {
        console.error(error)
        return null
    }
}

export interface GetUserByIdResponse {
    data: { users: User[] }
}

export interface Channel {
    id: string;
    url: string;
    name: string;
    description: string;
    follower_count: number;
    object: string;
    image_url: string;
    created_at: number;
    parent_url: string;
    lead: User;
    hosts: User[];
    moderator: User;
}

export interface User {
    object: string
    fid: number
    custody_address: string
    username: string
    display_name: string
    pfp_url: string
    profile: Profile
    follower_count: number
    following_count: number
    verifications: string[]
    verified_addresses: VerifiedAddresses
    active_status: string
    power_badge: boolean
    viewer_context: ViewerContext
}

export interface Profile {
    bio: Bio
}

export interface Bio {
    text: string
    mentioned_profiles: any[]
}

export interface VerifiedAddresses {
    eth_addresses: string[]
    sol_addresses: any[]
}

export interface ViewerContext {
    following: boolean
    followed_by: boolean
}
