/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/verifyToken";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
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
 *         description: User ID
 *     responses:
 *       200:
 *         description: User fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_user:
 *                       type: integer
 *                     nama_user:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     nohp:
 *                       type: string
 *                     jk:
 *                       type: string
 *                     nama_usaha:
 *                       type: string
 *                     status_usaha:
 *                       type: string
 *                     verifiedAt:
 *                       type: string
 *                       format: date-time
 *                     tbl_level:
 *                       type: object
 *                     tbl_kategori_usaha:
 *                       type: object
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user
 *   put:
 *     summary: Update user by ID
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
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_user:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               nohp:
 *                 type: string
 *               jk:
 *                 type: string
 *               nama_usaha:
 *                 type: string
 *               status_usaha:
 *                 type: string
 *               verifiedAt:
 *                 type: string
 *                 format: date-time
 *               tbl_level:
 *                 type: object
 *               tbl_kategori_usaha:
 *                 type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 *       500:
 *         description: Failed to update user
 *   delete:
 *     summary: Delete user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       500:
 *         description: Failed to delete user
 */
export async function GET(
  request: NextRequest,
  {
    params
  }: {
    params: Promise<{ id: number }>;
  }
) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  const { id } = await params;

  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const user = await prisma.tbl_user.findUnique({
      where: { id_user: Number(id) },
      include: {
        tbl_level: true,
        tbl_kategori_usaha: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User fetched successfully",
      data: user
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Failed to fetch user", error },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  {
    params
  }: {
    params: Promise<{ id: number }>;
  }
) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  const { id } = await params;
  console.log("ID:", id);
  try {
    const body = await request.json();
    const { password, ...updateData } = body;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const updatedUser = await prisma.tbl_user.update({
      where: { id_user: Number(id) },
      data: updateData
    });

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;

    console.log(userWithoutPassword);
    return NextResponse.json({
      message: "User updated successfully",
      data: userWithoutPassword
    });
  } catch (error: unknown) {
    console.error("Update user error:", error);
    return NextResponse.json(
      {
        message: "Failed to update user",
        error: error instanceof Error ? error.message : String(error)
      },
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
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  const { id } = await params;

  try {
    await prisma.tbl_user.delete({
      where: { id_user: Number(id) }
    });
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete user", error },
      { status: 500 }
    );
  }
}
