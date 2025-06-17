import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/verifyToken";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const article = await prisma.tbl_artikel.findUnique({
      where: { id_artikel: id },
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

/**
 * @swagger
 * /api/articles/{id}:
 *   put:
 *     summary: Update an article by ID
 *     description: Updates the specified article with new data. Requires authentication and appropriate user level (1, 2, or 3).
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the article to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judul:
 *                 type: string
 *                 description: The title of the article
 *               deskripsi_singkat:
 *                 type: string
 *                 description: Short description of the article
 *               isi_lengkap:
 *                 type: string
 *                 description: Full content of the article
 *               gambar:
 *                 type: string
 *                 description: Image URL or path for the article
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
 *       400:
 *         description: Invalid ID format
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
 *         description: Failed to update article
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
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const verificationResult = await verifyToken(request);

  if (
    !verificationResult.success ||
    !verificationResult.user ||
    ![1, 2, 3].includes(verificationResult.user.id_level)
  ) {
    return NextResponse.json(
      { message: verificationResult.error || "Akses ditolak." },
      { status: verificationResult.status || 401 }
    );
  }

//   const user = verificationResult.user as DecodedUserPayload;
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { judul, deskripsi_singkat, isi_lengkap, gambar } = body;

    const updatedArticle = await prisma.tbl_artikel.update({
      where: { id_artikel: id },
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const verificationResult = await verifyToken(request);

  if (
    !verificationResult.success ||
    !verificationResult.user ||
    ![1, 2, 3].includes(verificationResult.user.id_level)
  ) {
    return NextResponse.json(
      { message: verificationResult.error || "Akses ditolak." },
      { status: verificationResult.status || 401 }
    );
  }
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    await prisma.tbl_artikel.delete({
      where: { id_artikel: id }
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
