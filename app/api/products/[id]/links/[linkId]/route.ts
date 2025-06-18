import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";

/**
 * @swagger
 * /api/products/{id}/links/{linkId}:
 *   put:
 *     summary: Update a specific product link
 *     description: Updates the details of a product link by its ID. Requires authentication and appropriate user level.
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
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the link to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update in the link
 *     responses:
 *       200:
 *         description: Link updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid Link ID
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
 *         description: Failed to update link
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
    return NextResponse.json({ message: "Invalid Link ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updatedLink = await prisma.tbl_olshop_link.update({
      where: { id_link: Number(id) },
      data: body
    });
    return NextResponse.json({
      message: "Link updated successfully",
      data: updatedLink
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update link", error },
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
  const [, errorResponse] = await authorizeRequest(request, [1, 2]); // Hanya untuk Admin & SuperAdmin

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid Link ID" }, { status: 400 });
  }

  try {
    await prisma.tbl_olshop_link.delete({
      where: { id_link: Number(id) }
    });
    return NextResponse.json({ message: "Link deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete link", error },
      { status: 500 }
    );
  }
}
