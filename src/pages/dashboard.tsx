import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import DashboardPage from '~/components/dashboard'

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context)

    if (!session) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    return {
        props: { session }
    }
}

export default DashboardPage