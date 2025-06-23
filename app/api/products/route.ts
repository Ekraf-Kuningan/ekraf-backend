import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { uploadToRyzenCDN } from "@/lib/RyzenCDN";



export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchQuery = searchParams.get("q");
  const subSectorId = searchParams.get("subsector");

  const whereClause: Record<string, unknown> = {};
  if (searchQuery) {
    whereClause.nama_produk = {
      contains: searchQuery,
      mode: "insensitive"
    };
  }
  if (subSectorId && !isNaN(parseInt(subSectorId))) {
    whereClause.id_sub = parseInt(subSectorId);
  }

  const skip = (page - 1) * limit;

  try {
    const products = await prisma.tbl_product.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        tbl_user: {
          select: {
            nama_user: true
          }
        }
      },
      orderBy: {
        tgl_upload: "desc"
      }
    });

    const totalProducts = await prisma.tbl_product.count({
      where: whereClause
    });

    return NextResponse.json({
      message: "Products fetched successfully",
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      data: products
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch products", error },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Membuat produk baru
 *     description: Endpoint untuk membuat produk baru dengan mengunggah gambar ke RyzenCDN.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nama_produk
 *               - harga
 *               - stok
 *               - id_sub
 *               - gambar
 *             properties:
 *               nama_produk:
 *                 type: string
 *                 description: Nama produk
 *               deskripsi:
 *                 type: string
 *                 description: Deskripsi produk
 *               harga:
 *                 type: string
 *                 description: Harga produk
 *               stok:
 *                 type: string
 *                 description: Stok produk
 *               nohp:
 *                 type: string
 *                 description: Nomor HP penjual
 *               id_sub:
 *                 type: string
 *                 description: ID subkategori produk
 *               gambar:
 *                 type: string
 *                 format: binary
 *                 description: File gambar produk
 *     responses:
 *       201:
 *         description: Produk berhasil dibuat
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
 *         description: Field wajib tidak diisi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Gagal membuat produk atau mengunggah gambar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export async function POST(request: NextRequest) {
  const [user, errorResponse] = await authorizeRequest(request, [1, 2,3]);

  if (errorResponse) {
    return errorResponse;
  }

  try {
    const formData = await request.formData();
    const nama_produk = formData.get("nama_produk") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const harga = formData.get("harga") as string;
    const stok = formData.get("stok") as string;
    const nohp = formData.get("nohp") as string;
    const id_sub = formData.get("id_sub") as string;
    const gambarFile = formData.get("gambar") as File | null;

    if (!nama_produk || !harga || !stok || !id_sub || !gambarFile) {
      return NextResponse.json(
        { message: "Field wajib (termasuk gambar) harus diisi" },
        { status: 400 }
      );
    }

    // Upload gambar ke RyzenCDN
    const imageUrl = await uploadToRyzenCDN(gambarFile);

    if (!imageUrl) {
      return NextResponse.json(
        { message: "Gagal mengunggah gambar ke CDN" },
        { status: 500 }
      );
    }

    const newProduct = await prisma.tbl_product.create({
      data: {
        // id_produk will be omitted if your schema uses @id @default(autoincrement())
        nama_produk,
        deskripsi,
        harga: parseFloat(harga),
        stok: parseInt(stok, 10),
        nohp,
        gambar: imageUrl, // Simpan URL dari RyzenCDN
        id_user: user!.id_user,
        tgl_upload: new Date()
      }
    });

    return NextResponse.json(
      { message: "Product created successfully", data: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create product", error },
      { status: 500 }
    );
  }
}