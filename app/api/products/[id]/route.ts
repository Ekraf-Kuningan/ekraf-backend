import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { updateProductSchema } from "@/lib/zod";

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
 *         application/json:
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
 *             additionalProperties: false
 *             description: All fields are optional for partial update
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
 *       required: []
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json(
      { message: "Format ID tidak valid" },
      { status: 400 }
    );
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json(
      { message: "Format ID tidak valid" },
      { status: 400 }
    );
  }

  // 2. Otorisasi dan verifikasi kepemilikan (tidak berubah)
  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  const cekIdUser = await prisma.tbl_product.findUnique({
    where: { id_produk: Number(id) },
    select: { id_user: true }
  });
  if (user?.id_user !== cekIdUser?.id_user) {
    return NextResponse.json(
      { message: "Forbidden: You can only access your own products." },
      { status: 403 }
    );
  }
  if (errorResponse) return errorResponse;
  if (!user)
    return NextResponse.json(
      { message: "User tidak terautentikasi" },
      { status: 401 }
    );

  try {
    const productToUpdate = await prisma.tbl_product.findUnique({
      where: { id_produk: Number(id) },
      select: { id_user: true }
    });

    if (!productToUpdate) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    if (user.id_level === 3 && productToUpdate.id_user !== user.id_user) {
      return NextResponse.json(
        {
          message:
            "Akses ditolak: Anda hanya dapat menyunting produk milik sendiri."
        },
        { status: 403 }
      );
    }

    // 3. Baca body request sebagai JSON
    const body = await request.json();

    // 4. Validasi data menggunakan skema update (parsial)
    const validationResult = updateProductSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Data tidak valid.",
          errors: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    // 5. Logika upload file dihapus, langsung siapkan data untuk update
    const dataToUpdate = validationResult.data;

    // Jika tidak ada data yang dikirim untuk diupdate
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: "Tidak ada data untuk diperbarui." },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.tbl_product.update({
      where: { id_produk: Number(id) },
      data: dataToUpdate // Langsung gunakan data yang sudah tervalidasi
    });

    return NextResponse.json({
      message: "Produk berhasil diperbarui",
      data: updatedProduct
    });
  } catch (error) {
    console.error("Gagal memperbarui produk:", error);
    // ... (Penanganan error Prisma lainnya bisa ditambahkan di sini jika perlu) ...
    return NextResponse.json(
      { message: "Gagal memperbarui produk" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: number }> }
) {
  const { id } = await params;
  if (isNaN(id)) {
    return NextResponse.json(
      { message: "Format ID tidak valid" },
      { status: 400 }
    );
  }

  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  if (errorResponse) return errorResponse;
  if (!user)
    return NextResponse.json(
      { message: "User tidak terautentikasi" },
      { status: 401 }
    );

  try {
    const productToDelete = await prisma.tbl_product.findUnique({
      where: { id_produk: Number(id) }, // DIUBAH
      select: { id_user: true }
    });

    if (!productToDelete) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const isOwner = productToDelete.id_user === user.id_user;
    const isAdmin = user.id_level === 1 || user.id_level === 2;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          message:
            "Akses ditolak: Anda hanya dapat menghapus produk milik sendiri."
        },
        { status: 403 }
      );
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
    return NextResponse.json(
      { message: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}
