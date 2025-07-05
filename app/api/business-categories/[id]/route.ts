import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { BusinessCategorySchema } from "@/lib/zod";
import { prepareForJsonResponse } from "@/lib/bigintUtils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });

  try {
    const businessCategory = await prisma.business_categories.findUnique({
      where: { id: Number(id) },
      include: {
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            description: true
          }
        },
        _count: {
          select: {
            products: true,
            users: true,
            temporary_users: true
          }
        }
      }
    });

    if (!businessCategory) {
      return NextResponse.json({ message: "Business category not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Data retrieved successfully", data: prepareForJsonResponse(businessCategory) });

  } catch {
    return NextResponse.json({ message: "Failed to retrieve data" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/business-categories/{id}:
 *   get:
 *     summary: Get business category by ID
 *     description: Retrieve business category details by ID.
 *     tags:
 *       - Business Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business category ID to retrieve
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/BusinessCategory'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ID format"
 *       404:
 *         description: Business category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business category not found"
 *       500:
 *         description: Failed to retrieve data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve data"
 *
 *   put:
 *     summary: Update business category by ID
 *     description: Update existing business category name, image, subsector, and description by ID.
 *     tags:
 *       - Business Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business category ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               image:
 *                 type: string
 *                 nullable: true
 *               sub_sector_id:
 *                 type: integer
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Business category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business category updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/BusinessCategory'
 *       400:
 *         description: Invalid ID format or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid data"
 *                 errors:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 *       401:
 *         description: Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid token"
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access denied"
 *       404:
 *         description: Business category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business category not found."
 *       409:
 *         description: Business category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business category name already exists."
 *       500:
 *         description: Failed to update business category due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to update business category"
 *
 *   delete:
 *     summary: Delete business category by ID
 *     description: Delete business category by ID.
 *     tags:
 *       - Business Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business category ID to delete
 *     responses:
 *       200:
 *         description: Business category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business category deleted successfully."
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ID format"
 *       401:
 *         description: Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid token"
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access denied"
 *       404:
 *         description: Business category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business category not found."
 *       500:
 *         description: Failed to delete business category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to delete business category"
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });

  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  if (errorResponse) return errorResponse;
  
  try {
    const body = await request.json();
    const validationResult = BusinessCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: "Invalid data", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatedBusinessCategory = await prisma.business_categories.update({
      where: { id: Number(id) },
      data: { 
        name: validationResult.data.name,
        image: validationResult.data.image ?? undefined,
        sub_sector_id: validationResult.data.sub_sector_id,
        description: validationResult.data.description ?? undefined
      }
    });

    return NextResponse.json({ message: "Business category updated successfully", data: prepareForJsonResponse(updatedBusinessCategory) });

  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') return NextResponse.json({ message: "Business category not found" }, { status: 404 });
        if (error.code === 'P2002') return NextResponse.json({ message: "Business category name already exists" }, { status: 409 });
     }
    return NextResponse.json({ message: "Failed to update business category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });

  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  if (errorResponse) return errorResponse;

  try {
    await prisma.business_categories.delete({
      where: { id: Number(id) }
    });
    return NextResponse.json({ message: "Business category deleted successfully" });

  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: "Business category not found" }, { status: 404 });
     }
    return NextResponse.json({ message: "Failed to delete business category" }, { status: 500 });
  }
}
