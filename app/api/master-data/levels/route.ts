import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/master-data/levels:
 *   get:
 *     summary: Retrieve all user levels
 *     description: Fetches a list of all user levels from the database, ordered by their ID.
 *     tags:
 *       - Master Data
 *     responses:
 *       200:
 *         description: User levels fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User levels fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TblLevel'
 *       500:
 *         description: Failed to fetch user levels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch user levels
 *                 error:
 *                   type: string
 *                   example: Error details
 */
export async function GET() {
  try {
    const userLevels = await prisma.tbl_level.findMany({
      orderBy: {
        id_level: 'asc',
      },
    });

    return NextResponse.json({
      message: 'User levels fetched successfully',
      data: userLevels,
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch user levels', error },
      { status: 500 }
    );
  }
}