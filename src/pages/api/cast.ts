import type { NextApiRequest, NextApiResponse } from "next";

type ComposerActionFormResponse = {
    type: 'form';
    title: string;
    url: string;
}

type ComposerActionMetadata = {
    type: "composer";
    name: string;
    icon: string;
    description: string;
    imageUrl: string;
    aboutUrl?: string;
    action: {
        type: "post";
    }
}

interface CastState {
    cast: {
        parent?: string;
        text?: string;
        embeds?: string[];
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ComposerActionFormResponse | ComposerActionMetadata>
) {
    if (req.method === 'GET') {
        const metadata: ComposerActionMetadata = {
            type: "composer",
            name: "Bren",
            icon: "rocket",
            description: "Tip Base Frens",
            imageUrl: "https://www.bren.lol/icon-bren.png",
            action: {
                type: "post"
            }
        };
        return res.status(200).json(metadata);
    }

    if (req.method === 'POST') {
        const { untrustedData, trustedData } = req.body;

        if (!untrustedData || !trustedData || typeof untrustedData.fid !== 'number') {
            return res.status(400).json({ type: 'form', title: 'Error', url: 'https://www.bren.lol/' });
        }

        const { fid, state } = untrustedData;

        let decodedState: CastState | null = null;
        if (state) {
            try {
                const decodedStateString = decodeURIComponent(state);
                decodedState = JSON.parse(decodedStateString) as CastState;
            } catch (error) {
                console.error('Error parsing state:', error);
            }
        }

        // For local testing, use localhost. For production, use your actual domain.
        const baseUrl = 'https://www.bren.lol/action';

        const url = new URL(baseUrl);
        url.searchParams.append('fid', fid.toString());

        if (decodedState?.cast) {
            if (decodedState.cast.text) {
                url.searchParams.append('text', decodedState.cast.text);
            }
            if (decodedState.cast.parent) {
                url.searchParams.append('parent', decodedState.cast.parent);
            }
        }

        console.log('Constructed URL:', url.toString());

        return res.status(200).json({
            type: 'form',
            title: 'Bren',
            url: url.toString(),
        });
    }

    return res.status(405).end(); // Method Not Allowed
}