import { NextRequest, NextResponse } from "next/server";
import prisma, { Prisma } from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { productSchema } from "@/lib/zod";



export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchQuery = searchParams.get("q");
  const kategoriUsahaId = searchParams.get("kategori"); // Diubah dari 'subsector'

  const whereClause: Prisma.productsWhereInput = {};
  if (searchQuery) {
    whereClause.name = {
      contains: searchQuery
    };
  }
  // Diubah untuk memfilter berdasarkan business_category_id
  if (kategoriUsahaId && !isNaN(parseInt(kategoriUsahaId))) {
    whereClause.business_category_id = parseInt(kategoriUsahaId);
  }

  const skip = (page - 1) * limit;

  try {
    const products = await prisma.products.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        business_category: true, // Diubah dari Subsector
        users: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        uploaded_at: "desc"
      }
    });

    const totalProducts = await prisma.products.count({
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
 *   get:
 *     summary: Mendapatkan daftar produk
 *     description: Mengambil daftar produk dengan opsi pencarian, filter kategori, dan paginasi.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Halaman yang ingin diambil
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah produk per halaman
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian nama produk
 *       - in: query
 *         name: kategori
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan ID kategori usaha
 *     responses:
 *       200:
 *         description: Daftar produk berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         description: Gagal mengambil daftar produk
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *   post:
 *     summary: Membuat produk baru
 *     description: Endpoint untuk membuat produk baru. Hanya dapat diakses oleh user dengan role tertentu (1, 2, 3).
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nama produk
 *               owner_name:
 *                 type: string
 *                 description: Nama pelaku usaha
 *               description:
 *                 type: string
 *                 description: Deskripsi produk
 *               price:
 *                 type: number
 *                 description: Harga produk
 *               stock:
 *                 type: integer
 *                 description: Stok produk
 *               phone_number:
 *                 type: string
 *                 description: Nomor HP pelaku usaha
 *               business_category_id:
 *                 type: integer
 *                 description: ID kategori usaha
 *               image:
 *                 type: string
 *                 description: URL gambar produk
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
 *         description: Data tidak valid atau kategori usaha tidak valid
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
 *         description: Produk dengan nama atau detail serupa sudah ada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Terjadi kesalahan pada server saat membuat produk
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
// Skema Zod yang telah diperbarui diimpor dari lokasi yang sesuai
// import { productSchema } from './schemas'; 

export async function POST(request: NextRequest) {
  // 1. Otorisasi (tidak berubah)
  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  if (errorResponse) {
    return errorResponse;
  }

  // 2. Baca body request sebagai JSON, bukan FormData
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Request body tidak valid (bukan JSON)." }, { status: 400 });
  }

  // 3. Validasi data menggunakan skema Zod yang baru
  const validationResult = productSchema.safeParse(body);

  if (!validationResult.success) {
    return NextResponse.json(
      { 
        message: "Data tidak valid.",
        errors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // Data sudah bersih, tervalidasi, dan siap disimpan
  const productData = validationResult.data;

  try {
    // 4. Logika upload ke CDN dihapus. Langsung simpan ke database.
    const newProduct = await prisma.products.create({
      data: {
        ...productData,
        description: productData.description ?? "",
        phone_number: productData.phone_number ?? "",
        user_id: user!.id,
        uploaded_at: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Produk berhasil dibuat", data: newProduct },
      { status: 201 }
    );

  } catch (error) {
    console.error("Gagal membuat produk:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: "Gagal: Produk dengan nama atau detail serupa sudah ada." },
          { status: 409 }
        );
      }
      if (error.code === 'P2003') {
        // Error ini terjadi jika business_category_id atau user_id tidak valid
        return NextResponse.json(
          { message: `Kategori atau User yang dipilih tidak valid.` },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server saat membuat produk." },
      { status: 500 }
    );
  }
}
