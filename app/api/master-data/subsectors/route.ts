import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/master-data/subsectors:
 *   get:
 *     summary: Retrieve a list of subsectors
 *     description: Fetches all subsectors from the database, ordered alphabetically by sub_sektor.
 *     tags:
 *       - Master Data
 *     responses:
 *       200:
 *         description: Subsectors fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subsectors fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subsector'
 *       500:
 *         description: Failed to fetch subsectors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch subsectors
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export async function GET() {
  try {
    const subsectors = await prisma.sub_sectors.findMany({
      orderBy: {
        title: 'asc',
      },
    });

    const data = subsectors.map(item => ({
      ...item,
      id: item.id.toString()
    }))

    return NextResponse.json({
      message: 'Subsectors fetched successfully',
      data: data,
    });

  } catch (error) {
    console.error('Error fetching subsectors:', error);
    return NextResponse.json(
      { message: 'Failed to fetch subsectors', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
