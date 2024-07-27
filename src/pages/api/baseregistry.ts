import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { stringify } from 'csv-stringify/sync';

interface Entry {
    title: string;
    short_description: string;
    full_description: string;
    target_url: string;
    contract_address: string;
}

interface APIResponse {
    data: {
        content: {
            title?: string;
            short_description?: string;
            full_description?: string;
            target_url?: string;
            contract_address?: string;
        };
    }[];
}

function isValidAPIResponse(data: unknown): data is APIResponse {
    return (
        typeof data === 'object' &&
        data !== null &&
        'data' in data &&
        Array.isArray((data as APIResponse).data)
    );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const response = await fetch('https://base.org/api/registry/entries?limit=92');
        const data: unknown = await response.json();

        if (!isValidAPIResponse(data)) {
            throw new Error('Invalid API response structure');
        }

        const processedData: Entry[] = data.data.map((entry) => ({
            title: entry.content.title || '',
            short_description: entry.content.short_description || '',
            full_description: entry.content.full_description || '',
            target_url: entry.content.target_url || '',
            contract_address: entry.content.contract_address || ''
        }));

        // Convert data to CSV
        const csv = stringify(processedData, { header: true });

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=base_registry_entries.csv');

        // Send CSV as response
        res.status(200).send(csv);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
}