import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { prepareForJsonResponse } from '@/lib/bigintUtils';

/**
 * @swagger
 * /api/master-data/business-categories:
 *   get:
 *     summary: Retrieve a list of business categories
 *     description: Fetches all business categories from the database, ordered by category name.
 *     tags:
 *       - Master Data
 *     responses:
 *       200:
 *         description: Business categories fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Business categories fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BusinessCategory'
 *       500:
 *         description: Failed to fetch business categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch business categories
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
export async function GET() {
  try {
    const businessCategories = await prisma.business_categories.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        sub_sector_id: true,
        description: true,
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            description: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      message: 'Business categories fetched successfully',
      data: prepareForJsonResponse(businessCategories),
    });

  } catch (error) {
    console.error('Error fetching business categories:', error);
    return NextResponse.json(
      { message: 'Failed to fetch business categories', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
