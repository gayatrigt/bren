export interface inviteWeebHookResponse {
    created_at: number
    type: string
    data: Data
}

export interface Data {
    object: string
    hash: string
    thread_hash: string
    parent_hash: any
    parent_url: any
    root_parent_url: any
    parent_author: ParentAuthor
    author: Author
    text: string
    timestamp: string
    embeds: any[]
    reactions: Reactions
    replies: Replies
    channel: any
    mentioned_profiles: MentionedProfile[]
}

export interface ParentAuthor {
    fid: any
}

export interface Author {
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

export interface Reactions {
    likes_count: number
    recasts_count: number
    likes: any[]
    recasts: any[]
}

export interface Replies {
    count: number
}

export interface MentionedProfile {
    object: string
    fid: number
    custody_address: string
    username: string
    display_name: string
    pfp_url: string
    profile: Profile2
    follower_count: number
    following_count: number
    verifications: string[]
    verified_addresses: VerifiedAddresses2
    active_status: string
    power_badge: boolean
}

export interface Profile2 {
    bio: Bio2
}

export interface Bio2 {
    text: string
    mentioned_profiles: any[]
}

export interface VerifiedAddresses2 {
    eth_addresses: string[]
    sol_addresses: any[]
}
