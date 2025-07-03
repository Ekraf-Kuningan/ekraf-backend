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
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       username:
 *                         type: string
 *                         example: johndoe
 *                       email:
 *                         type: string
 *                         example: johndoe@example.com
 *                       phone_number:
 *                         type: string
 *                         example: "08123456789"
 *                       gender:
 *                         type: string
 *                         example: L
 *                       business_name:
 *                         type: string
 *                         example: Toko Jaya
 *                       verifiedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-06-01T12:00:00.000Z"
 *                       levels:
 *                         type: object
 *                         properties:
 *                           name:
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
        phone_number: true,
        gender: true,
        business_name: true,
        verifiedAt: true,
        levels: {
          select: {
            name: true
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