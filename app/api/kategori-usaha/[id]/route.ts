import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { KategoriUsahaSchema } from "@/lib/zod";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });

  try {
    const kategori = await prisma.business_categories.findUnique({
      where: { id: Number(id) }
    });

    if (!kategori) {
      return NextResponse.json({ message: "Kategori usaha tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ message: "Data berhasil diambil", data: kategori });

  } catch {
    return NextResponse.json({ message: "Gagal mengambil data" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/kategori-usaha/{id}:
 *   get:
 *     summary: Mengambil data kategori usaha berdasarkan ID
 *     description: Mengambil detail kategori usaha berdasarkan ID.
 *     tags:
 *       - Kategori Usaha
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kategori usaha yang akan diambil
 *     responses:
 *       200:
 *         description: Data berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               image:
 *                 type: string
 *                 nullable: true
 *       400:
 *         description: Format ID tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Kategori usaha tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Gagal mengambil data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *
 *   put:
 *     summary: Memperbarui data kategori usaha berdasarkan ID
 *     description: Memperbarui nama dan gambar kategori usaha yang sudah ada berdasarkan ID.
 *     tags:
 *       - Kategori Usaha
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kategori usaha yang akan diperbarui
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KategoriUsaha'
 *     responses:
 *       200:
 *         description: Kategori usaha berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/KategoriUsaha'
 *       400:
 *         description: Format ID tidak valid atau data tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: string
 *       404:
 *         description: Kategori usaha tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
 *         description: Gagal memperbarui kategori usaha karena kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *
 *   delete:
 *     summary: Menghapus kategori usaha berdasarkan ID
 *     description: Menghapus kategori usaha berdasarkan ID.
 *     tags:
 *       - Kategori Usaha
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kategori usaha yang akan dihapus
 *     responses:
 *       200:
 *         description: Kategori usaha berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Format ID tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Kategori usaha tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Gagal menghapus kategori usaha
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });

  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  if (errorResponse) return errorResponse;
  
  try {
    const body = await request.json();
    const validationResult = KategoriUsahaSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: "Data tidak valid", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatedKategori = await prisma.business_categories.update({
      where: { id: Number(id) },
      data: { 
        name: validationResult.data.name,
        image: validationResult.data.image ?? undefined
      }
    });

    return NextResponse.json({ message: "Kategori usaha berhasil diperbarui", data: updatedKategori });

  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') return NextResponse.json({ message: "Kategori usaha tidak ditemukan." }, { status: 404 });
        if (error.code === 'P2002') return NextResponse.json({ message: "Nama kategori usaha sudah ada." }, { status: 409 });
     }
    return NextResponse.json({ message: "Gagal memperbarui kategori usaha" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });

  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  if (errorResponse) return errorResponse;

  try {
    await prisma.business_categories.delete({
      where: { id: Number(id) }
    });
    return NextResponse.json({ message: "Kategori usaha berhasil dihapus." });

  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: "Kategori usaha tidak ditemukan." }, { status: 404 });
     }
    return NextResponse.json({ message: "Gagal menghapus kategori usaha" }, { status: 500 });
  }
}