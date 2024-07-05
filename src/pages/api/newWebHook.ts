import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        console.error('Method Not Allowed')
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    console.log(req.body)
}