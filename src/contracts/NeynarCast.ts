export interface Root {
    cast: Cast
}

export interface Cast {
    object: string
    hash: string
    thread_hash: string
    parent_hash: any
    parent_url: string
    root_parent_url: string
    parent_author: ParentAuthor
    author: Author
    text: string
    timestamp: string
    embeds: any[]
    reactions: Reactions
    replies: Replies
    channel: Channel
    mentioned_profiles: MentionedProfile[]
}

export interface ParentAuthor {
    fid: number
}

interface Author {
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

interface Profile {
    bio: Bio
}

interface Bio {
    text: string
}

interface VerifiedAddresses {
    eth_addresses: string[]
    sol_addresses: any[]
}

interface Reactions {
    likes_count: number
    recasts_count: number
    likes: Like[]
    recasts: any[]
}

interface Like {
    fid: number
    fname: string
}

interface Replies {
    count: number
}

interface Channel {
    object: string
    id: string
    name: string
    image_url: string
}

interface MentionedProfile {
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

interface Profile2 {
    bio: Bio2
}

interface Bio2 {
    text: string
    mentioned_profiles: any[]
}

interface VerifiedAddresses2 {
    eth_addresses: string[]
    sol_addresses: any[]
}
