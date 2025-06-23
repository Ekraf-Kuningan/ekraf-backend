import { NextRequest, NextResponse } from "next/server";
import prisma, { Prisma } from "@/lib/prisma";
import { authorizeRequest } from "@/lib/auth/authorizeRequest";
import { uploadToRyzenCDN } from "@/lib/RyzenCDN";
import { z } from "zod";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchQuery = searchParams.get("q");
  const kategoriUsahaId = searchParams.get("kategori"); // Diubah dari 'subsector'

  const whereClause: Prisma.tbl_productWhereInput = {};
  if (searchQuery) {
    whereClause.nama_produk = {
      contains: searchQuery
    };
  }
  // Diubah untuk memfilter berdasarkan id_kategori_usaha
  if (kategoriUsahaId && !isNaN(parseInt(kategoriUsahaId))) {
    whereClause.id_kategori_usaha = parseInt(kategoriUsahaId);
  }

  const skip = (page - 1) * limit;

  try {
    const products = await prisma.tbl_product.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        tbl_kategori_usaha: true, // Diubah dari tbl_subsektor
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Skema Zod disesuaikan sepenuhnya ke tbl_kategori_usaha
const productSchema = z.object({
  nama_produk: z.string()
    .min(3, { message: "Nama produk harus memiliki minimal 3 karakter." })
    .max(100, { message: "Nama produk tidak boleh lebih dari 100 karakter." }),
  nama_pelaku: z.string().optional(),
  deskripsi: z.string().optional(),
  harga: z.coerce
    .number({ invalid_type_error: "Harga harus berupa angka." })
    .positive({ message: "Harga harus lebih dari 0." }),
  stok: z.coerce
    .number({ invalid_type_error: "Stok harus berupa angka." })
    .int({ message: "Stok harus berupa bilangan bulat." })
    .nonnegative({ message: "Stok tidak boleh negatif." }),
  nohp: z.string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/, { message: "Format nomor HP tidak valid." })
    .optional()
    .or(z.literal('')),
  id_kategori_usaha: z.coerce // DIUBAH DARI id_sub
    .number({ invalid_type_error: "Kategori Usaha tidak valid." })
    .int()
    .positive({ message: "Kategori Usaha harus dipilih." }),
  gambar: z.instanceof(File, { message: "Gambar wajib diunggah." })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Ukuran gambar maksimal adalah 5MB.`)
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Format gambar tidak didukung (.jpg, .jpeg, .png, .webp).")
});


/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Mendapatkan daftar produk
 *     description: Mengambil daftar produk dengan opsi pencarian, filter kategori, dan paginasi.
 *     tags:
 *       - Produk
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
 *       - Produk
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nama_produk:
 *                 type: string
 *                 description: Nama produk
 *               nama_pelaku:
 *                 type: string
 *                 description: Nama pelaku usaha
 *               deskripsi:
 *                 type: string
 *                 description: Deskripsi produk
 *               harga:
 *                 type: number
 *                 description: Harga produk
 *               stok:
 *                 type: integer
 *                 description: Stok produk
 *               nohp:
 *                 type: string
 *                 description: Nomor HP pelaku usaha
 *               id_kategori_usaha:
 *                 type: integer
 *                 description: ID kategori usaha
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
 *         description: Terjadi kesalahan pada server saat membuat produk atau gagal upload gambar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function POST(request: NextRequest) {
  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  if (errorResponse) {
    return errorResponse;
  }

  const formData = await request.formData();
  const dataToValidate = {
    nama_produk: formData.get("nama_produk"),
    nama_pelaku: formData.get("nama_pelaku"),
    deskripsi: formData.get("deskripsi"),
    harga: formData.get("harga"),
    stok: formData.get("stok"),
    nohp: formData.get("nohp"),
    id_kategori_usaha: formData.get("id_kategori_usaha"),
    gambar: formData.get("gambar"),
  };
  
  const validationResult = productSchema.safeParse(dataToValidate);

  if (!validationResult.success) {
    return NextResponse.json(
      { 
        message: "Data tidak valid.",
        errors: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { gambar: gambarFile, ...productData } = validationResult.data;

  try {
    const imageUrl = await uploadToRyzenCDN(gambarFile);
    if (!imageUrl) {
      return NextResponse.json(
        { message: "Gagal mengunggah gambar ke CDN." },
        { status: 500 }
      );
    }

    const newProduct = await prisma.tbl_product.create({
      data: {
        ...productData, // productData sekarang berisi id_kategori_usaha
        nama_pelaku: productData.nama_pelaku || null,
        deskripsi: productData.deskripsi || "",
        nohp: productData.nohp || "",
        gambar: imageUrl,
        id_user: user!.id_user,
        tgl_upload: new Date(),
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
           return NextResponse.json(
             { message: `Kategori Usaha yang dipilih tidak valid atau tidak ada.` },
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