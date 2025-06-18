import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/verifyToken";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";

export async function GET(
  {
    params
  }: {
    params: Promise<{ id: number }>;
  },
  request: NextRequest
) {
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  try {
    const product = await prisma.tbl_product.findUnique({
      where: { id_produk: Number(id) },
      include: {
        tbl_subsektor: true,
        tbl_user: { select: { nama_user: true, email: true } },
        tbl_olshop_link: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Product fetched successfully",
      data: product
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch product", error },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     description: Updates the details of a product. Only users with id_level 1, 2, or 3 are authorized.
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
 *         description: The ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *             description: Fields to update in the product
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *         description: Invalid ID format
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
 *         description: Failed to update product
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
export async function PUT(
  request: NextRequest,
  {
    params
  }: {
    params: Promise<{ id: number }>;
  }
) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]); // Hanya untuk Admin & SuperAdmin

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  const { id } = await params;

  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updatedProduct = await prisma.tbl_product.update({
      where: { id_produk: Number(id) },
      data: body
    });

    return NextResponse.json({
      message: "Product updated successfully",
      data: updatedProduct
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update product", error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params
  }: {
    params: Promise<{ id: number }>;
  }
) {
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
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    await prisma.tbl_product.delete({
      where: { id_produk: Number(id) }
    });
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete product", error },
      { status: 500 }
    );
  }
}
