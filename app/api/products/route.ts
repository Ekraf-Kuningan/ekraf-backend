/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken,DecodedUserPayload } from '@/lib/verifyToken';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const searchQuery = searchParams.get('q');
  const subSectorId = searchParams.get('subsector');

  const whereClause: Record<string, unknown> = {};
  if (searchQuery) {
    whereClause.nama_produk = {
      contains: searchQuery,
    };
  }
  if (subSectorId && !isNaN(parseInt(subSectorId))) {
    whereClause.id_sub = parseInt(subSectorId);
  }

  const skip = (page - 1) * limit;

  try {
    const products = await prisma.tbl_product.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        tbl_subsektor: true,
        tbl_user: {
          select: {
            nama_user: true,
          },
        },
      },
      orderBy: {
        tgl_upload: 'desc',
      },
    });

    const totalProducts = await prisma.tbl_product.count({ where: whereClause });

    return NextResponse.json({
      message: 'Products fetched successfully',
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      data: products,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch products', error },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     description: Creates a new product entry in the database. Only users with id_level 1, 2, or 3 are authorized.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_produk
 *               - harga
 *               - stok
 *               - id_sub
 *             properties:
 *               nama_produk:
 *                 type: string
 *                 description: Name of the product
 *               deskripsi:
 *                 type: string
 *                 description: Description of the product
 *               harga:
 *                 type: number
 *                 description: Price of the product
 *               stok:
 *                 type: number
 *                 description: Stock quantity
 *               nohp:
 *                 type: string
 *                 description: Contact phone number
 *               id_sub:
 *                 type: integer
 *                 description: Subcategory ID
 *               gambar:
 *                 type: string
 *                 description: Image URL or base64 string
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Required fields are missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create product
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
export async function POST(request: NextRequest) {
    
    const verificationResult = await verifyToken(request);
    const user = verificationResult.user as DecodedUserPayload;

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
    try {
        const body = await request.json();
        const {
            nama_produk,
            deskripsi,
            harga,
            stok,
            nohp,
            id_sub,
            gambar,
        } = body;

        if (!nama_produk || !harga || !stok || !id_sub) {
            return NextResponse.json(
                { message: 'Required fields are missing' },
                { status: 400 }
            );
        }

        const newProduct = await prisma.tbl_product.create({
            data: {
                ...body,
                id_user: user.id_user, 
                tgl_upload: new Date(),
            },
        });

        return NextResponse.json(
            { message: 'Product created successfully', data: newProduct },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: 'Failed to create product', error },
            { status: 500 }
        );
    }
}