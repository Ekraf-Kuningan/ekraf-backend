import { NextRequest, NextResponse } from "next/server";
import prisma, { Prisma } from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { z } from "zod";
/**
 * @swagger
 * /api/subsectors/{id}:
 *   get:
 *     summary: Get subsector by ID
 *     tags:
 *       - Subsectors
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID subsektor
 *     responses:
 *       200:
 *         description: Data subsektor berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Subsector'
 *       400:
 *         description: Format ID tidak valid
 *       404:
 *         description: Subsektor tidak ditemukan
 *       500:
 *         description: Gagal mengambil data
 *   put:
 *     summary: Update subsector by ID
 *     tags:
 *       - Subsectors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID subsektor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_sub:
 *                 type: string
 *                 minLength: 3
 *     responses:
 *       200:
 *         description: Subsektor berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Subsector'
 *       400:
 *         description: Data tidak valid / Format ID tidak valid
 *       404:
 *         description: Subsektor tidak ditemukan
 *       409:
 *         description: Nama subsektor sudah ada
 *       500:
 *         description: Gagal memperbarui subsektor
 *   delete:
 *     summary: Delete subsector by ID
 *     tags:
 *       - Subsectors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID subsektor
 *     responses:
 *       200:
 *         description: Subsektor berhasil dihapus
 *       400:
 *         description: Format ID tidak valid
 *       404:
 *         description: Subsektor tidak ditemukan
 *       500:
 *         description: Gagal menghapus subsektor
 *
 * components:
 *   schemas:
 *     Subsector:
 *       type: object
 *       properties:
 *         id_sub:
 *           type: integer
 *         sub_sektor:
 *           type: string
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });

  try {
    const subsector = await prisma.tbl_subsektor.findUnique({
      where: { id_sub: Number(id) }
    });

    if (!subsector) {
      return NextResponse.json({ message: "Subsektor tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ message: "Data berhasil diambil", data: subsector });

  } catch {
    return NextResponse.json({ message: "Gagal mengambil data" }, { status: 500 });
  }
}

const SubsectorSchema = z.object({
  nama_sub: z.string().min(3, { message: "Nama subsektor harus memiliki minimal 3 karakter." })
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });

  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  if (errorResponse) return errorResponse;
  
  try {
    const body = await request.json();
    const validationResult = SubsectorSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ message: "Data tidak valid", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const updatedSubsector = await prisma.tbl_subsektor.update({
      where: { id_sub: Number(id) },
      data: { sub_sektor: validationResult.data.nama_sub }
    });

    return NextResponse.json({ message: "Subsektor berhasil diperbarui", data: updatedSubsector });

  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') return NextResponse.json({ message: "Subsektor tidak ditemukan." }, { status: 404 });
        if (error.code === 'P2002') return NextResponse.json({ message: "Nama subsektor sudah ada." }, { status: 409 });
     }
    return NextResponse.json({ message: "Gagal memperbarui subsektor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
  const { id } = await params;
  if (isNaN(id)) return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });

  const [, errorResponse] = await authorizeRequest(request, [1, 2]);
  if (errorResponse) return errorResponse;

  try {
    await prisma.tbl_subsektor.delete({
      where: { id_sub: Number(id) }
    });
    return NextResponse.json({ message: "Subsektor berhasil dihapus." });

  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ message: "Subsektor tidak ditemukan." }, { status: 404 });
     }
    return NextResponse.json({ message: "Gagal menghapus subsektor" }, { status: 500 });
  }
}