import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { uploadToRyzenCDN } from "@/lib/RyzenCDN";

export async function GET(
  request: NextRequest,

  {
    params
  }: {
    params: Promise<{ id: number }>;
  }
) {
  const { id } = await params;

  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const product = await prisma.tbl_product.findUnique({
      where: { id_produk: id },
      include: {
        tbl_user: { select: { nama_user: true, email: true } },
        tbl_olshop_link: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Product fetched successfully",
      data: product
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch product", error },
      { status: 500 }
    );
  }
}
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get a product by ID
 *     description: Retrieves detailed information about a specific product including related data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID to retrieve
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
 *                   example: "Product fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 *
 *   put:
 *     tags:
 *       - Products
 *     summary: Update a product
 *     description: Updates an existing product with the provided data. Supports file upload for product image.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nama_produk:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *               harga:
 *                 type: number
 *                 format: float
 *               stok:
 *                 type: integer
 *               nohp:
 *                 type: string
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
 *                   example: "Product updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error or image upload failed
 *
 *   delete:
 *     tags:
 *       - Products
 *     summary: Delete a product
 *     description: Deletes a product and its associated online shop links. Requires authorization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID to delete
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
 *                   example: "Product deleted successfully"
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */

export async function PUT(
  request: NextRequest,
   {
    params
  }: {
    params: Promise<{ id: number }>;
  }
) {
  const { id } = await params;

  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }
  // 2. Otorisasi user, izinkan level 1, 2, dan 3 untuk melanjutkan
  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  
  if (errorResponse) {
    return errorResponse; // Gagal jika tidak login atau level tidak diizinkan
  }

  try {
    // 3. Ambil data produk untuk verifikasi kepemilikan
    const productToUpdate = await prisma.tbl_product.findUnique({
      where: { id_produk: Number(id) },
      select: { id_user: true } // Cukup ambil id_user untuk verifikasi
    });

    // Jika produk tidak ditemukan
    if (!productToUpdate) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // 4. Terapkan logika hak akses
    // Jika user adalah level 3 (UMKM), periksa apakah dia pemilik produk
    if (user?.id_level === 3 && productToUpdate.id_user !== user?.id_user) {
      // Jika bukan pemilik, kembalikan error 403 (Forbidden)
      return NextResponse.json(
        { message: "Akses ditolak: Anda hanya dapat menyunting produk milik sendiri." },
        { status: 403 }
      );
    }
    
    // Jika user adalah admin (level 1, 2) atau pemilik produk (level 3), lanjutkan pembaruan

    const formData = await request.formData();
    const updateData: Record<string, string | number> = {};

    // Proses semua field teks dari form data
    const fields = ["nama_produk", "deskripsi", "harga", "stok", "nohp"];
    fields.forEach((field) => {
      if (formData.has(field)) {
        const value = formData.get(field) as string;
        // Konversi tipe data sesuai kebutuhan skema Prisma
        if (field === "harga") updateData[field] = parseFloat(value);
        else if (field === "stok") updateData[field] = parseInt(value, 10);
        else updateData[field] = value;
      }
    });

    // Proses file gambar jika ada yang diunggah
    const gambarFile = formData.get("gambar") as File | null;
    if (gambarFile) {
      // Unggah gambar baru ke CDN dan dapatkan URL-nya
      const imageUrl = await uploadToRyzenCDN(gambarFile);
      if (imageUrl) {
        updateData.gambar = imageUrl;
      } else {
        return NextResponse.json(
          { message: "Gagal mengunggah gambar baru, pembaruan dibatalkan" },
          { status: 500 }
        );
      }
    }

    // Lakukan pembaruan data di database
    const updatedProduct = await prisma.tbl_product.update({
      where: { id_produk: id },
      data: updateData
    });

    return NextResponse.json({
      message: "Product updated successfully",
      data: updatedProduct
    });

  } catch (error) {
    console.error("Failed to update product:", error); // Log error untuk debugging
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
 {
    params
  }: {
    params: Promise<{ id: number }>;
  }
) {
  const { id } = await params;

  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  // 2. Otorisasi user, izinkan level 1, 2, dan 3 untuk melanjutkan
  //    Level 3 akan divalidasi lebih lanjut di bawah
  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);

  if (errorResponse) {
    return errorResponse; // Gagal jika tidak login atau level tidak diizinkan
  }

  try {
    // 3. Ambil data produk untuk verifikasi kepemilikan
    const productToDelete = await prisma.tbl_product.findUnique({
      where: { id_produk: id },
      select: { id_user: true } // Cukup ambil id_user untuk verifikasi
    });

    // Jika produk tidak ditemukan
    if (!productToDelete) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // 4. Terapkan logika hak akses
    // Jika user adalah level 3 (UMKM), periksa apakah dia pemilik produk
    if (user?.id_level === 3 && productToDelete.id_user !== user?.id_user) {
      // Jika bukan pemilik, kembalikan error 403 (Forbidden)
      return NextResponse.json(
        {
          message:
            "Akses ditolak: Anda hanya dapat menghapus produk milik sendiri."
        },
        { status: 403 }
      );
    }

    // Jika user adalah admin (level 1, 2) atau pemilik produk (level 3), lanjutkan penghapusan

    // Hapus link toko online yang terkait terlebih dahulu
    await prisma.tbl_olshop_link.deleteMany({
      where: { id_produk: id }
    });

    // Hapus produk dari database
    await prisma.tbl_product.delete({
      where: { id_produk: id }
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Failed to delete product:", error); // Log error untuk debugging
    return NextResponse.json(
      { message: "Failed to delete product" },
      { status: 500 }
    );
  }
}
