export interface NeynarChannel {
    channel: Channel
}

export interface Channel {
    id: string
    url: string
    name: string
    description: string
    follower_count: number
    object: string
    image_url: string
    created_at: number
    parent_url: string
    lead: Lead
    moderator: any
    viewer_context: ViewerContext
}

export interface Lead {
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
}

export interface Profile {
    bio: Bio
}

export interface Bio {
    text: string
}

export interface VerifiedAddresses {
    eth_addresses: string[]
    sol_addresses: any[]
}

export interface ViewerContext {
    following: boolean
}
