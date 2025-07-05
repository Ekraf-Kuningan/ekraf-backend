import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { prepareForJsonResponse } from '@/lib/bigintUtils';

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
      include: {
        business_categories: {
          select: {
            id: true,
            name: true,
            image: true,
            description: true
          }
        },
        _count: {
          select: {
            business_categories: true,
            products: true,
            catalogs: true
          }
        }
      },
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json({
      message: 'Subsectors fetched successfully',
      data: prepareForJsonResponse(subsectors),
    });

  } catch (error) {
    console.error('Error fetching subsectors:', error);
    return NextResponse.json(
      { message: 'Failed to fetch subsectors' },
      { status: 500 }
    );
  }
}
