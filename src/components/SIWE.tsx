import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount, useSignMessage, useChainId } from 'wagmi'
import { useRouter } from 'next/router'
import { signIn, signOut, useSession } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import { getCsrfToken } from 'next-auth/react'

function SignInButton() {
    const { openConnectModal } = useConnectModal()
    const { isConnected, address } = useAccount()
    const chainId = useChainId()
    const { signMessageAsync } = useSignMessage()
    const router = useRouter()
    const { data: session } = useSession()

    const handleAuth = async () => {
        if (!isConnected) {
            openConnectModal?.()
            return
        }

        try {
            console.log("Current chain ID:", chainId)
            console.log("Connected address:", address)

            const nonce = await getCsrfToken()
            console.log("Generated nonce:", nonce)

            if (!nonce) {
                throw new Error("Failed to generate nonce")
            }

            const message = new SiweMessage({
                domain: window.location.host,
                address: address!,
                statement: 'Sign in with Ethereum to the app.',
                uri: window.location.origin,
                version: '1',
                chainId: chainId,
                nonce: nonce,
            })

            console.log("SIWE Message:", message)

            const signature = await signMessageAsync({
                message: message.prepareMessage(),
            })

            console.log("Signature:", signature)

            const signInData = {
                message: JSON.stringify(message),
                signature,
                redirect: false,
                callbackUrl: '/telegram/link',
            }
            console.log("Data being sent to signIn:", signInData)

            const response = await signIn('credentials', signInData)

            console.log("SignIn Response:", response)

            if (response?.ok) {
                // Refresh the page using router.push
                router.push(router.asPath)
            } else {
                console.error('Authentication failed:', response?.error)
            }
        } catch (error) {
            console.error('Error during authentication:', error)
        }
    }

    return (
        <button onClick={session ? () => signOut() : handleAuth}>
            {session ? 'Sign Out' : 'Sign In with Ethereum'}
        </button>
    )
}

export default SignInButton