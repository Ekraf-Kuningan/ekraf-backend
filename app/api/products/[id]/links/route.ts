import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json(
      { message: "Invalid Product ID" },
      { status: 400 }
    );
  }

  try {
    const links = await prisma!.online_store_links.findMany({
      where: { product_id: Number(id) }
    });
    return NextResponse.json({
      message: "Links fetched successfully",
      data: links
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch links", error },
      { status: 500 }
    );
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
 *               - platform_name
 *               - url
 *             properties:
 *               platform_name:
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
 */
export async function POST(request: NextRequest, 
  { params }: { params: Promise<{ id: number }> }
) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json(
      { message: "Invalid Product ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { platform_name, url } = body;

    if (!platform_name || !url) {
      return NextResponse.json(
        { message: "Required fields missing" },
        { status: 400 }
      );
    }

    const newLink = await prisma!.online_store_links.create({
      data: {
        product_id: Number(id),
        platform_name,
        url
      }
    });

    return NextResponse.json(
      { message: "Link created successfully", data: newLink },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create link", error },
      { status: 500 }
    );
  }
}
