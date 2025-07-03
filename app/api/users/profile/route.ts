import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";

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
 *                     id_user:
 *                       type: integer
 *                       example: 1
 *                     nama_user:
 *                       type: string
 *                       example: John Doe
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     nohp:
 *                       type: string
 *                       example: "08123456789"
 *                     jk:
 *                       type: string
 *                       example: L
 *                     nama_usaha:
 *                       type: string
 *                       example: Usaha Jaya
 *                     status_usaha:
 *                       type: string
 *                       example: Aktif
 *                     verifiedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-06-01T12:00:00Z"
 *                     tbl_level:
 *                       type: object
 *                       description: User level information
 *                     tbl_kategori_usaha:
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
        nohp: true,
        jk: true,
        nama_usaha: true,
        status_usaha: true,
        verifiedAt: true,
        tbl_level: true,
        tbl_kategori_usaha: true
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
      data: userProfile
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch profile", error },
      { status: 500 }
    );
  }
}
