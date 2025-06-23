import { NextRequest, NextResponse } from "next/server";
import prisma, { Prisma } from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { z } from "zod";

/**
 * @swagger
 * /api/kategori-usaha/{id}:
 *   get:
 *     summary: Get kategori usaha by ID
 *     tags:
 *       - Kategori Usaha
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID kategori usaha
 *     responses:
 *       200:
 *         description: Data berhasil diambil
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
 *         description: Format ID tidak valid
 *       404:
 *         description: Kategori usaha tidak ditemukan
 *       500:
 *         description: Gagal mengambil data
 *   put:
 *     summary: Update kategori usaha by ID
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
 *         description: ID kategori usaha
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
 *         description: Data tidak valid / Format ID tidak valid
 *       404:
 *         description: Kategori usaha tidak ditemukan
 *       409:
 *         description: Nama kategori usaha sudah ada
 *       500:
 *         description: Gagal memperbarui kategori usaha
 *   delete:
 *     summary: Delete kategori usaha by ID
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
 *         description: ID kategori usaha
 *     responses:
 *       200:
 *         description: Kategori usaha berhasil dihapus
 *       400:
 *         description: Format ID tidak valid
 *       404:
 *         description: Kategori usaha tidak ditemukan
 *       500:
 *         description: Gagal menghapus kategori usaha
 *
 * components:
 *   schemas:
 *     KategoriUsaha:
 *       type: object
 *       properties:
 *         id_kategori_usaha:
 *           type: integer
 *         nama_kategori:
 *           type: string
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });

  try {
    const kategori = await prisma.tbl_kategori_usaha.findUnique({
      where: { id_kategori_usaha: Number(id) }
    });

    if (!kategori) {
      return NextResponse.json({ message: "Kategori usaha tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ message: "Data berhasil diambil", data: kategori });

  } catch {
    return NextResponse.json({ message: "Gagal mengambil data" }, { status: 500 });
  }
}

const KategoriUsahaSchema = z.object({
  nama_kategori_usaha: z.string().min(3, { message: "Nama kategori harus memiliki minimal 3 karakter." })
});



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

    const updatedKategori = await prisma.tbl_kategori_usaha.update({
      where: { id_kategori_usaha: Number(id) },
      data: { nama_kategori: validationResult.data.nama_kategori_usaha }
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
    await prisma.tbl_kategori_usaha.delete({
      where: { id_kategori_usaha: Number(id) }
    });
    return NextResponse.json({ message: "Kategori usaha berhasil dihapus." });

  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: "Kategori usaha tidak ditemukan." }, { status: 404 });
     }
    return NextResponse.json({ message: "Gagal menghapus kategori usaha" }, { status: 500 });
  }
}