import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/auth/authorizeRequest';

interface RouteParams {
  params: { id: string };
}

/**
 * @swagger
 * /api/users/{id}/products:
 *   get:
 *     summary: Get products for a specific user
 *     description: Fetches all products associated with a given user ID, ordered by upload date (descending).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the user to get products for
 *     responses:
 *       200:
 *         description: Products for the user fetched successfully
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
 *                     $ref: '#/components/schemas/Product'
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
 *         description: Failed to fetch products
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
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = parseInt(params.id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  
    // 2. Jika ada errorResponse, langsung kembalikan.
    if (errorResponse) {
      return errorResponse;
    }
  try {
    const products = await prisma.tbl_product.findMany({
      where: { id_user: userId },
      orderBy: {
        tgl_upload: 'desc',
      },
    });

    return NextResponse.json({
      message: `Products for user ${userId} fetched successfully`,
      data: products,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch products', error }, { status: 500 });
  }
}