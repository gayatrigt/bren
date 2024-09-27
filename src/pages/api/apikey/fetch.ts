import fetch from 'node-fetch';

interface ApiCredential {
    platform: string;
    apiKey: string;
    apiSecret: string;
}

async function fetchApiKeys() {
    try {
        const response = await fetch('https://bren-staging.vercel.app/api/apikey/get');
        const data: unknown = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Unexpected data format: not an array');
        }

        const apiCredentials = data as ApiCredential[];

        console.log('API Credentials:');
        apiCredentials.forEach((cred) => {
            console.log(`Platform: ${cred.platform}`);
            console.log(`API Key: ${cred.apiKey}`);
            console.log(`API Secret: ${cred.apiSecret}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error fetching API credentials:', error);
    }
}

fetchApiKeys();