import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { BusinessCategorySchema } from "@/lib/zod";
import { prepareForJsonResponse } from "@/lib/bigintUtils";

/**
 * @swagger
 * /api/business-categories:
 *   get:
 *     summary: Get list of business categories
 *     tags:
 *       - Business Categories
 *     responses:
 *       200:
 *         description: Business categories retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       image:
 *                         type: string
 *                         nullable: true
 *                       sub_sector_id:
 *                         type: integer
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       sub_sectors:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           slug:
 *                             type: string
 *       500:
 *         description: Failed to retrieve business categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *   post:
 *     summary: Create new business category
 *     tags:
 *       - Business Categories
 *     security:
 *       - bearerAuth: []
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
 *                 description: Related subsector ID
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Business category description
 *     responses:
 *       201:
 *         description: Business category created successfully
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
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     image:
 *                       type: string
 *                       nullable: true
 *                     sub_sector_id:
 *                       type: integer
 *                     description:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: object
 *       409:
 *         description: Business category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create business category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function GET() {
  try {
    const businessCategories = await prisma!.business_categories.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true,
        image: true,
        sub_sector_id: true,
        description: true,
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });
    return NextResponse.json({
      message: "Business categories retrieved successfully",
      data: prepareForJsonResponse(businessCategories)
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to retrieve business categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const validationResult = BusinessCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Invalid data",
          errors: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const newBusinessCategory = await prisma!.business_categories.create({
      data: {
        name: validationResult.data.name,
        image: validationResult.data.image ?? null,
        sub_sector_id: validationResult.data.sub_sector_id,
        description: validationResult.data.description ?? null
      }
    });

    return NextResponse.json(
      { message: "Business category created successfully", data: prepareForJsonResponse(newBusinessCategory) },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Business category name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Failed to create business category" },
      { status: 500 }
    );
  }
}