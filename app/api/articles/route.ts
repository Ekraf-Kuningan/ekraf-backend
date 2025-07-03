import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";

export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
 
  if (page < 1 || limit < 1) {
    return NextResponse.json(
      { message: "Page and limit must be positive integers" },
      { status: 400 }
    );
  }

  const skip = (page - 1) * limit;

  try {
    const articles = await prisma.tbl_artikel.findMany({
      skip: skip,
      take: limit,
      include: {
        users: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        tanggal_upload: "desc"
      }
    });

    const totalArticles = await prisma.tbl_artikel.count();

    return NextResponse.json({
      message: "Articles fetched successfully",
      totalPages: Math.ceil(totalArticles / limit),
      currentPage: page,
      data: articles
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch articles", error },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: Create a new article
 *     description: Creates a new article. Only users with admin (1), superadmin (2), or editor (3) privileges can access this endpoint.
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - judul
 *               - isi_lengkap
 *               - id_user
 *             properties:
 *               judul:
 *                 type: string
 *                 description: Title of the article
 *               deskripsi_singkat:
 *                 type: string
 *                 description: Short description of the article
 *               isi_lengkap:
 *                 type: string
 *                 description: Full content of the article
 *               id_user:
 *                 type: integer
 *                 description: ID of the user creating the article
 *               gambar:
 *                 type: string
 *                 description: Image URL or path (optional)
 *     responses:
 *       201:
 *         description: Article created successfully
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
 *         description: Required fields are missing
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
 *         description: Failed to create article
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
export async function POST(request: NextRequest) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]); // Hanya untuk Admin & SuperAdmin

  // 2. Jika ada errorResponse, langsung kembalikan.
  if (errorResponse) {
    return errorResponse;
  }
  try {
    const body = await request.json();
    const { judul, deskripsi_singkat, isi_lengkap, id_user, gambar } = body;

    if (!judul || !isi_lengkap || !id_user) {
      return NextResponse.json(
        { message: "Required fields are missing: judul, isi_lengkap, id_user" },
        { status: 400 }
      );
    }

    const newArticle = await prisma.tbl_artikel.create({
      data: {
        id_artikel: Date.now(), // or use a proper unique ID generator if needed
        judul,
        deskripsi_singkat,
        isi_lengkap,
        id_user: body.id_user,
        gambar,
        tanggal_upload: new Date()
      }
    });

    return NextResponse.json(
      { message: "Article created successfully", data: newArticle },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create article", error },
      { status: 500 }
    );
  }
}
