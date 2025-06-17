import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

/**
 * @swagger
 * /api/users/{id}/articles:
 *   get:
 *     summary: Get articles for a specific user
 *     description: Fetches all articles associated with a given user ID, ordered by upload date (descending).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the user
 *     responses:
 *       200:
 *         description: Articles for the user fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *       400:
 *         description: Invalid User ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to fetch articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export async function GET(request: Request, { params }: RouteParams) {
  const userId = parseInt(params.id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  try {
    const articles = await prisma.tbl_artikel.findMany({
      where: { id_user: userId },
      orderBy: {
        tanggal_upload: 'desc',
      },
    });

    return NextResponse.json({
      message: `Articles for user ${userId} fetched successfully`,
      data: articles,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch articles', error }, { status: 500 });
  }
}