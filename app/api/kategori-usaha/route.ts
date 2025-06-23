import { NextRequest, NextResponse } from "next/server";
import prisma, { Prisma } from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { z } from "zod";

/**
 * @swagger
 * /api/kategori-usaha:
 *   get:
 *     summary: Mendapatkan daftar kategori usaha
 *     tags:
 *       - Kategori Usaha
 *     responses:
 *       200:
 *         description: Daftar kategori usaha berhasil diambil
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
 *                       id_kategori_usaha:
 *                         type: integer
 *                       nama_kategori:
 *                         type: string
 *       500:
 *         description: Gagal mengambil data Kategori Usaha
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *   post:
 *     summary: Membuat kategori usaha baru
 *     tags:
 *       - Kategori Usaha
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_kategori_usaha:
 *                 type: string
 *                 minLength: 3
 *     responses:
 *       201:
 *         description: Kategori usaha berhasil dibuat
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
 *                     id_kategori_usaha:
 *                       type: integer
 *                     nama_kategori:
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
 *         description: Nama kategori usaha sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Gagal membuat kategori usaha
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
    const kategoriUsaha = await prisma.tbl_kategori_usaha.findMany({
      orderBy: {
        nama_kategori: "asc"
      }
    });
    return NextResponse.json({
      message: "Kategori Usaha berhasil diambil",
      data: kategoriUsaha
    });
  } catch {
    return NextResponse.json(
      { message: "Gagal mengambil data Kategori Usaha" },
      { status: 500 }
    );
  }
}

const KategoriUsahaSchema = z.object({
  nama_kategori_usaha: z
    .string()
    .min(3, { message: "Nama kategori harus memiliki minimal 3 karakter." })
});

export async function POST(request: NextRequest) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const validationResult = KategoriUsahaSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Data tidak valid",
          errors: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const newKategori = await prisma.tbl_kategori_usaha.create({
      data: {
        nama_kategori: validationResult.data.nama_kategori_usaha
      }
    });

    return NextResponse.json(
      { message: "Kategori usaha berhasil dibuat", data: newKategori },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Nama kategori usaha sudah ada." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Gagal membuat kategori usaha" },
      { status: 500 }
    );
  }
}
