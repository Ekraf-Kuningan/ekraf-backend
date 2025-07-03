import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { prepareForJsonResponse } from "@/lib/bigintUtils";

// Helper function to generate a slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
}

export async function GET(request: NextRequest) {

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);
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
    const articles = await prisma.artikels.findMany({
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
        created_at: "desc"
      }
    });

    const totalArticles = await prisma.artikels.count();

    return NextResponse.json({
      message: "Articles fetched successfully",
      totalPages: Math.ceil(totalArticles / limit),
      currentPage: page,
      data: prepareForJsonResponse(articles)
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
 *               - title
 *               - content
 *               - author_id
 *               - artikel_kategori_id
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the article
 *               content:
 *                 type: string
 *                 description: Full content of the article
 *               author_id:
 *                 type: integer
 *                 description: ID of the user creating the article
 *               artikel_kategori_id:
 *                 type: integer
 *                 description: ID of the article category
 *               thumbnail:
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
    const { title, content, author_id, thumbnail, artikel_kategori_id } = body;

    if (!title || !content || !author_id || !artikel_kategori_id) {
      return NextResponse.json(
        { message: "Required fields are missing: title, content, author_id, artikel_kategori_id" },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);

    const newArticle = await prisma.artikels.create({
      data: {
        title,
        content,
        author_id: Number(author_id),
        thumbnail,
        artikel_kategori_id: Number(artikel_kategori_id),
        slug,
      }
    });

    return NextResponse.json(
      { message: "Article created successfully", data: prepareForJsonResponse(newArticle) },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create article", error },
      { status: 500 }
    );
  }
}
