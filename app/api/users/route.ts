import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users
 *     description: Returns a list of users. Only accessible by users with id_level 1 or 2.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Users fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_user:
 *                         type: integer
 *                         example: 1
 *                       nama_user:
 *                         type: string
 *                         example: John Doe
 *                       username:
 *                         type: string
 *                         example: johndoe
 *                       email:
 *                         type: string
 *                         example: johndoe@example.com
 *                       nohp:
 *                         type: string
 *                         example: "08123456789"
 *                       jk:
 *                         type: string
 *                         example: L
 *                       nama_usaha:
 *                         type: string
 *                         example: Toko Jaya
 *                       verifiedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-06-01T12:00:00.000Z"
 *                       tbl_level:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: string
 *                             example: Admin
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
 *         description: Failed to fetch users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch users
 *                 error:
 *                   type: string
 */
export async function GET(request: NextRequest) {
   const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  
    // 2. Jika ada errorResponse, langsung kembalikan.
    if (errorResponse) {
      return errorResponse;
    }

  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        nohp: true,
        jk: true,
        nama_usaha: true,
        verifiedAt: true,
        tbl_level: {
          select: {
            level: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json({
      message: "Users fetched successfully",
      data: users
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch users", error },
      { status: 500 }
    );
  }
}
