import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";


/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: API endpoints for managing articles
 */

/**
 * @swagger
 * /api/articles/{id}:
 *   get:
 *     summary: Get an article by ID
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The article ID
 *     responses:
 *       200:
 *         description: Article fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *       404:
 *         description: Article not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch article
 *   put:
 *     summary: Update an article by ID
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The article ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judul:
 *                 type: string
 *               deskripsi_singkat:
 *                 type: string
 *               isi_lengkap:
 *                 type: string
 *               gambar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found
 *       500:
 *         description: Failed to update article
 *   delete:
 *     summary: Delete an article by ID
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The article ID
 *     responses:
 *       200:
 *         description: Article deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Article not found
 *       500:
 *         description: Failed to delete article
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Article:
 *       type: object
 *       properties:
 *         id_artikel:
 *           type: integer
 *         judul:
 *           type: string
 *         deskripsi_singkat:
 *           type: string
 *         isi_lengkap:
 *           type: string
 *         gambar:
 *           type: string
 *         tbl_user:
 *           type: object
 *           properties:
 *             nama_user:
 *               type: string
 *             email:
 *               type: string
 */
export async function GET( request: NextRequest,
  {
    params
  }: {
    params: Promise<{ id: number }>;
  }) {
  const { id } = await params;
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  
  try {
    const article = await prisma.tbl_artikel.findUnique({
      where: { id_artikel: Number(id) },
      include: {
        tbl_user: {
          select: {
            nama_user: true,
            email: true
          }
        }
      }
    });

    if (!article) {
      return NextResponse.json(
        { message: `Article with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Article fetched successfully",
      data: article
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch article", error },
      { status: 500 }
    );
  }
}

export async function PUT( request: NextRequest,
  {
    params
  }: {
    params: Promise<{ id: number }>;
  }) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]); // Hanya untuk Admin & SuperAdmin

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }

  const {id} = await params
  try {
    const body = await request.json();
    const { judul, deskripsi_singkat, isi_lengkap, gambar } = body;

    const updatedArticle = await prisma.tbl_artikel.update({
      where: { id_artikel: Number(id) },
      data: {
        judul,
        deskripsi_singkat,
        isi_lengkap,
        gambar
      }
    });

    return NextResponse.json({
      message: "Article updated successfully",
      data: updatedArticle
    });
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to update article with ID ${id}`, error },
      { status: 500 }
    );
  }
}

export async function DELETE( request: NextRequest,
  {
    params
  }: {
    params: Promise<{ id: number }>;
  }) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  const { id } = await params;
  try {
    await prisma.tbl_artikel.delete({
      where: { id_artikel: Number(id) }
    });

    return NextResponse.json({
      message: `Article with ID ${id} deleted successfully`
    });
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to delete article with ID ${id}`, error },
      { status: 500 }
    );
  }
}
