import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/verifyToken';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const productId = parseInt(params.id, 10);
  if (isNaN(productId)) {
    return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
  }

  try {
    const links = await prisma.tbl_olshop_link.findMany({
      where: { id_produk: productId },
    });
    return NextResponse.json({ message: 'Links fetched successfully', data: links });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch links', error }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/products/{id}/links:
 *   post:
 *     summary: Create a new online shop link for a product
 *     description: Adds a new link to an online shop platform for the specified product. Requires authentication and appropriate user level.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_platform
 *               - url
 *             properties:
 *               nama_platform:
 *                 type: string
 *                 description: The name of the online shop platform
 *                 example: Tokopedia
 *               url:
 *                 type: string
 *                 description: The URL to the product on the platform
 *                 example: https://tokopedia.com/produk/123
 *     responses:
 *       201:
 *         description: Link created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Link created successfully
 *                 data:
 *                   $ref: '#/components/schemas/TblOlshopLink'
 *       400:
 *         description: Invalid Product ID or required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid Product ID
 *       401:
 *         description: Unauthorized or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Akses ditolak.
 *       500:
 *         description: Failed to create link due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to create link
 *                 error:
 *                   type: string
 *                   example: Error details
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const verificationResult = await verifyToken(request);
    
      if (
        !verificationResult.success ||
        !verificationResult.user ||
        ![1, 2, 3].includes(verificationResult.user.id_level) 
      ) {
        return NextResponse.json(
          { message: verificationResult.error || "Akses ditolak." },
          { status: verificationResult.status || 401 }
        );
      }
  const productId = parseInt(params.id, 10);
  if (isNaN(productId)) {
    return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { nama_platform, url } = body;

    if (!nama_platform || !url) {
      return NextResponse.json({ message: 'Required fields missing' }, { status: 400 });
    }

    const newLink = await prisma.tbl_olshop_link.create({
      data: {
        id_produk: productId,
        nama_platform,
        url,
      },
    });

    return NextResponse.json({ message: 'Link created successfully', data: newLink }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create link', error }, { status: 500 });
  }
}