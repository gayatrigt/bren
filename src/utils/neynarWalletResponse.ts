export type WalletResponse = Record<string, Wallet>

export interface Wallet {
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
