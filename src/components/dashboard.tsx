import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        console.log('Session status:', status)
        console.log('Session data:', session)

        if (status === 'unauthenticated') {
            console.log('User is unauthenticated, redirecting to home')
            router.push('/')
        } else if (status === 'authenticated' && session) {
            console.log('User is authenticated')
            setIsLoading(false)
        }
    }, [status, session, router])

    if (isLoading || status === 'loading') {
        return <div>Loading...</div>
    }

    if (!session || !session.user) {
        console.log('No session or user data, showing null')
        return null
    }

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome, {session.user.walletAddress || 'User'}</p>
            <p>Session status: {status}</p>
            <p>User ID: {session.user.id}</p>
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
    )
}

export default DashboardPage