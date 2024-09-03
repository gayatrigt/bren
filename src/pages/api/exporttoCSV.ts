// File: /src/pages/api/exporttoCSV.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { createObjectCsvStringifier } from 'csv-writer'

const prisma = new PrismaClient()

type ModelName = Exclude<keyof PrismaClient, symbol | `$${string}`>

type PrismaModel = {
    findMany: (...args: any[]) => Promise<any[]>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' })
    }

    const { model } = req.query

    if (typeof model !== 'string') {
        return res.status(400).json({ message: 'Invalid model name' })
    }

    try {
        const prismaModel = prisma[model as ModelName] as unknown as PrismaModel

        if (typeof prismaModel !== 'object' || prismaModel === null || !('findMany' in prismaModel)) {
            return res.status(400).json({ message: `Invalid model name: ${model}` })
        }

        const records = await prismaModel.findMany()

        if (records.length === 0) {
            return res.status(404).json({ message: `No records found in ${model}` })
        }

        const headers = Object.keys(records[0]).map(key => ({ id: key, title: key }))

        const csvStringifier = createObjectCsvStringifier({
            header: headers
        })

        const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records)

        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename=${model}_export.csv`)
        res.status(200).send(csvString)
    } catch (error) {
        console.error('Error exporting data:', error)
        res.status(500).json({ message: 'Internal Server Error' })
    } finally {
        await prisma.$disconnect()
    }
}