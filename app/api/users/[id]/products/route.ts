import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";

/**
 * @swagger
 * /api/users/{id}/products:
 *   get:
 *     summary: Get products for a specific user
 *     description: Returns a list of products belonging to the specified user. Requires authentication.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Products fetched successfully
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch products
 */
export async function GET(
  request: NextRequest,
  {
    params
  }: {
    params: Promise<{ id: number }>;
  }
) {
  const { id } = await params;
  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);

  // Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }

  // Hanya bisa dirinya sendiri
  // Jika bukan admin (role 1 atau 2), hanya bisa akses dirinya sendiri
  if (
    (user?.level_id === undefined || ![1, 2].includes(user.level_id)) &&
    user?.id !== Number(id)
  ) {
    return NextResponse.json(
      { message: "Forbidden: You can only access your own products." },
      { status: 403 }
    );
  }

  try {
    const products = await prisma.products.findMany({
      where: { user_id: Number(id) },
      orderBy: {
        uploaded_at: "desc"
      }
    });

    return NextResponse.json({
      message: `Products for user ${id} fetched successfully`,
      data: products
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch products", error },
      { status: 500 }
    );
  }
}