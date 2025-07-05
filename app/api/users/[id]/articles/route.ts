import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { prepareForJsonResponse } from "@/lib/bigintUtils";

/**
 * @swagger
 * /api/users/{id}/articles:
 *   get:
 *     summary: Get articles for a specific user
 *     description: Fetches all articles associated with a given user ID, ordered by upload date (descending).
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
export async function GET(
  request: NextRequest,
  {
    params
  }: {
    params: Promise<{ id: number }>;
  }
) {
  const { id: userId } = await params;
  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);

  // 2. Jika ada errorResponse, langsung kembalikaan.
  if (errorResponse) {
    return errorResponse;
  }
  if (user?.id !== Number(userId)) {
    return NextResponse.json(
      { message: "Forbidden: You can only access your own articles." },
      { status: 403 }
    );
  }
  try {
    const articles = await prisma!.artikels.findMany({
      where: { author_id: Number(userId) },
      orderBy: {
        created_at: "desc"
      }
    });

    return NextResponse.json({
      message: `Articles for user ${userId} fetched successfully`,
      data: prepareForJsonResponse(articles)
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch articles", error },
      { status: 500 }
    );
  }
}