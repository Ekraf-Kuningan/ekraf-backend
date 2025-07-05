import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { updateProductSchema } from "@/lib/zod";
import { prepareForJsonResponse } from "@/lib/bigintUtils";

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
 *               name:
 *                 type: string
 *               owner_name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               phone_number:
 *                 type: string
 *               business_category_id:
 *                 type: integer
 *               image:
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
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         owner_name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         phone_number:
 *           type: string
 *         business_category_id:
 *           type: integer
 *         image:
 *           type: string
 *         user_id:
 *           type: integer
 *         business_categories:
 *           type: object
 *         users:
 *           type: object
 *         online_store_links:
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
    const product = await prisma!.products.findUnique({
      where: { id: Number(id) },
      include: {
        business_categories: {
          select: {
            id: true,
            name: true,
            image: true,
            description: true,
            sub_sectors: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        },
        sub_sectors: {
          select: {
            id: true,
            title: true,
            slug: true,
            image: true,
            description: true
          }
        },
        users: { 
          select: { 
            id: true,
            name: true, 
            email: true,
            username: true,
            phone_number: true
          } 
        },
        online_store_links: true
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
      data: prepareForJsonResponse(product)
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

  if (errorResponse) return errorResponse;
  if (!user)
    return NextResponse.json(
      { message: "User tidak terautentikasi" },
      { status: 401 }
    );

  try {
    const productToUpdate = await prisma!.products.findUnique({
      where: { id: Number(id) },
      select: { user_id: true }
    });

    if (!productToUpdate) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

      if (user?.level_id !== 1 && user?.level_id !== 2 && user?.id !== Number(productToUpdate.user_id)) {
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

    const updatedProduct = await prisma!.products.update({
      where: { id: Number(id) },
      data: dataToUpdate // Langsung gunakan data yang sudah tervalidasi
    });

    return NextResponse.json({
      message: "Produk berhasil diperbarui",
      data: prepareForJsonResponse(updatedProduct)
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
    const productToDelete = await prisma!.products.findUnique({
      where: { id: Number(id) },
      select: { user_id: true }
    });

    if (!productToDelete) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const isOwner = Number(productToDelete.user_id) === user.id;
    const isAdmin = user.level_id === 1 || user.level_id === 2;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          message:
            "Akses ditolak: Anda hanya dapat menghapus produk milik sendiri."
        },
        { status: 403 }
      );
    }

    await prisma!.online_store_links.deleteMany({
      where: { product_id: Number(id) }
    });

    await prisma!.products.delete({
      where: { id: Number(id) }
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