import { NextRequest, NextResponse } from "next/server";
import prisma, { Prisma } from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { z } from "zod";

// Helper function to generate a slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes
}

const SubsectorSchema = z.object({
  title: z.string().min(3, { message: "Nama subsektor harus memiliki minimal 3 karakter." })
});

/**
 * @swagger
 * /api/subsectors:
 *   get:
 *     summary: Mendapatkan daftar subsektor
 *     tags:
 *       - Subsectors
 *     responses:
 *       200:
 *         description: Daftar subsektor berhasil diambil
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
 *                       title:
 *                         type: string
 *       500:
 *         description: Gagal mengambil data Subsektor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *   post:
 *     summary: Membuat subsektor baru
 *     tags:
 *       - Subsectors
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *     responses:
 *       201:
 *         description: Sub sektor berhasil dibuat
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
 *                     title:
 *                       type: string
 *       400:
 *         description: Data tidak valid
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
 *         description: Nama subsektor sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Gagal membuat subsektor
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
    const subsectors = await prisma.sub_sectors.findMany({
      orderBy: {
        title: 'asc'
      }
    });
    return NextResponse.json({
      message: "Subsektor berhasil diambil",
      data: subsectors
    });
  } catch {
    return NextResponse.json(
      { message: "Gagal mengambil data Subsektor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const validationResult = SubsectorSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ message: "Data tidak valid", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const newSubsector = await prisma.sub_sectors.create({
      data: {
        title: validationResult.data.title,
        slug: generateSlug(validationResult.data.title) // Generate slug from title
      }
    });

    return NextResponse.json({ message: "Subsektor berhasil dibuat", data: newSubsector }, { status: 201 });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: "Nama subsektor sudah ada." }, { status: 409 });
    }
    return NextResponse.json({ message: "Gagal membuat subsektor" }, { status: 500 });
  }
}