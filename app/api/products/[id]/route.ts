import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { uploadToRyzenCDN } from "@/lib/RyzenCDN";

export async function GET(
  request: NextRequest,
  {
    params
  }: {
    params: { id: string };
  }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const product = await prisma.tbl_product.findUnique({
      where: { id_produk: id },
      include: {
        tbl_subsektor: true,
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
 *               id_sub:
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
    params: { id: string };
  }
) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);

  if (errorResponse) {
    return errorResponse;
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const updateData: Record<string, string | number | undefined> = {};

    const fields = [
      "nama_produk",
      "deskripsi",
      "harga",
      "stok",
      "nohp",
      "id_sub"
    ];
    fields.forEach((field) => {
      if (formData.has(field)) {
        const value = formData.get(field) as string;
        if (field === "harga") updateData[field] = parseFloat(value);
        else if (field === "stok" || field === "id_sub")
          updateData[field] = parseInt(value, 10);
        else updateData[field] = value;
      }
    });

    const gambarFile = formData.get("gambar") as File | null;

    if (gambarFile) {
      // Tidak perlu menghapus gambar lama dari CDN karena API-nya mungkin tidak ada
      // Cukup unggah yang baru dan ganti URL-nya.
      const imageUrl = await uploadToRyzenCDN(gambarFile);
      if (imageUrl) {
        updateData.gambar = imageUrl;
      } else {
        // Opsional: Batalkan pembaruan jika unggah gambar gagal
        return NextResponse.json(
          { message: "Gagal mengunggah gambar baru, pembaruan dibatalkan" },
          { status: 500 }
        );
      }
    }

    const updatedProduct = await prisma.tbl_product.update({
      where: { id_produk: id },
      data: updateData
    });

    return NextResponse.json({
      message: "Product updated successfully",
      data: updatedProduct
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update product", error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params
  }: {
    params: { id: string };
  }
) {
  const [, errorResponse] = await authorizeRequest(request, [1, 2]);

  if (errorResponse) {
    return errorResponse;
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    // Tidak perlu lagi menghapus file gambar dari server lokal

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
    return NextResponse.json(
      { message: "Failed to delete product", error },
      { status: 500 }
    );
  }
}
