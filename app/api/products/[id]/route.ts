import { NextRequest, NextResponse } from "next/server";
import prisma, { Prisma } from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { uploadToRyzenCDN } from "@/lib/RyzenCDN";
import { z } from "zod";
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the product to get
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update product by ID
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nama_produk:
 *                 type: string
 *               nama_pelaku:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *               harga:
 *                 type: number
 *               stok:
 *                 type: integer
 *               nohp:
 *                 type: string
 *               id_kategori_usaha:
 *                 type: integer
 *               gambar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete product by ID
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the product to delete
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 *
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id_produk:
 *           type: integer
 *         nama_produk:
 *           type: string
 *         nama_pelaku:
 *           type: string
 *         deskripsi:
 *           type: string
 *         harga:
 *           type: number
 *         stok:
 *           type: integer
 *         nohp:
 *           type: string
 *         id_kategori_usaha:
 *           type: integer
 *         gambar:
 *           type: string
 *         id_user:
 *           type: integer
 *         tbl_kategori_usaha:
 *           type: object
 *         tbl_user:
 *           type: object
 *         tbl_olshop_link:
 *           type: array
 *           items:
 *             type: object
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });
  }

  try {
    const product = await prisma.tbl_product.findUnique({
      where: { id_produk: Number(id) }, // DIUBAH
      include: {
        tbl_kategori_usaha: true,
        tbl_user: { select: { nama_user: true, email: true } },
        tbl_olshop_link: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Product fetched successfully",
      data: product
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengambil data produk", error },
      { status: 500 }
    );
  }
}

// ... Skema Zod tidak berubah ...
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const updateProductSchema = z.object({
  nama_produk: z.string().min(3).optional(),
  nama_pelaku: z.string().optional(),
  deskripsi: z.string().optional(),
  harga: z.coerce.number().positive().optional(),
  stok: z.coerce.number().int().nonnegative().optional(),
  nohp: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/).optional().or(z.literal('')),
  id_kategori_usaha: z.coerce.number().int().positive().optional(),
  gambar: z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE).refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)).optional()
});


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });
  }

  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  if (errorResponse) return errorResponse;
  if (!user) return NextResponse.json({ message: "User tidak terautentikasi" }, { status: 401 });
  
  try {
    const productToUpdate = await prisma.tbl_product.findUnique({
      where: { id_produk: Number(id) }, // DIUBAH
      select: { id_user: true }
    });

    if (!productToUpdate) {
      return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 });
    }

    const isOwner = productToUpdate.id_user === user.id_user;
    const isAdmin = user.id_level === 1 || user.id_level === 2;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Akses ditolak: Anda hanya dapat menyunting produk milik sendiri." }, { status: 403 });
    }

    const formData = await request.formData();
    const dataToValidate: Record<string, FormDataEntryValue> = {};
    formData.forEach((value, key) => {
      dataToValidate[key] = value;
    });

    const validationResult = updateProductSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      return NextResponse.json({ message: "Data tidak valid.", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { gambar: gambarFile, ...productData } = validationResult.data;
    const updateData: Prisma.tbl_productUpdateInput = { ...productData };

    if (gambarFile) {
      const imageUrl = await uploadToRyzenCDN(gambarFile);
      if (!imageUrl) return NextResponse.json({ message: "Gagal mengunggah gambar baru." }, { status: 500 });
      updateData.gambar = imageUrl;
    }

    const updatedProduct = await prisma.tbl_product.update({
      where: { id_produk: Number(id) }, // DIUBAH
      data: updateData,
    });

    return NextResponse.json({
      message: "Produk berhasil diperbarui",
      data: updatedProduct
    });

  } catch (error) {
    console.error("Gagal memperbarui produk:", error);
    return NextResponse.json({ message: "Gagal memperbarui produk" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json({ message: "Format ID tidak valid" }, { status: 400 });
  }

  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  if (errorResponse) return errorResponse;
  if (!user) return NextResponse.json({ message: "User tidak terautentikasi" }, { status: 401 });

  try {
    const productToDelete = await prisma.tbl_product.findUnique({
      where: { id_produk: Number(id) }, // DIUBAH
      select: { id_user: true }
    });

    if (!productToDelete) {
      return NextResponse.json({ message: "Produk tidak ditemukan" }, { status: 404 });
    }

    const isOwner = productToDelete.id_user === user.id_user;
    const isAdmin = user.id_level === 1 || user.id_level === 2;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Akses ditolak: Anda hanya dapat menghapus produk milik sendiri." }, { status: 403 });
    }

    await prisma.tbl_olshop_link.deleteMany({
      where: { id_produk: Number(id) } // DIUBAH
    });

    await prisma.tbl_product.delete({
      where: { id_produk: Number(id) } // DIUBAH
    });

    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Gagal menghapus produk:", error);
    return NextResponse.json({ message: "Gagal menghapus produk" }, { status: 500 });
  }
}