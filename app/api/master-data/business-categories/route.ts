import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      message: 'Business categories fetched successfully',
      data: businessCategories,
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch business categories', error },
      { status: 500 }
    );
  }
}
