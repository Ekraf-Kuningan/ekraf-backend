import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { prepareForJsonResponse } from "@/lib/bigintUtils";

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     description: Returns the profile information of the currently authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     phone_number:
 *                       type: string
 *                       example: "08123456789"
 *                     gender:
 *                       type: string
 *                       example: L
 *                     business_name:
 *                       type: string
 *                       example: Usaha Jaya
 *                     business_status:
 *                       type: string
 *                       example: Aktif
 *                     verifiedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-06-01T12:00:00Z"
 *                     levels:
 *                       type: object
 *                       description: User level information
 *                     business_categories:
 *                       type: object
 *                       description: Business category information
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile not found
 *       500:
 *         description: Failed to fetch profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch profile
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

export async function GET(request: NextRequest) {
  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const userProfile = await prisma.users.findUnique({
      where: { id: user?.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone_number: true,
        gender: true,
        business_name: true,
        business_status: true,
        verifiedAt: true,
        levels: true,
        business_categories: true
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile fetched successfully",
      data: prepareForJsonResponse(userProfile)
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch profile", error },
      { status: 500 }
    );
  }
}