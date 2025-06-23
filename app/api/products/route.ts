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
 *                 type: number
 *                 format: double
 *                 multipleOf: 0.01
 *                 description: Harga produk (decimal 10,2)
 *               stok:
 *                 type: integer
 *                 description: Stok produk
 *               nohp:
 *                 type: string
 *                 description: Nomor HP penjual
 *               id_sub:
 *                 type: integer
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
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const productSchema = z.object({
  nama_produk: z.string()
    .min(3, { message: "Nama produk harus memiliki minimal 3 karakter." })
    .max(100, { message: "Nama produk tidak boleh lebih dari 100 karakter." }),
  deskripsi: z.string().optional(),
  // Menggunakan coerce untuk mengubah string dari form menjadi number
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
    .or(z.literal('')), // Izinkan string kosong jika opsional
  id_sub: z.coerce
    .number({ invalid_type_error: "Kategori tidak valid." })
    .int()
    .positive({ message: "Kategori harus dipilih." }),
  gambar: z.instanceof(File, { message: "Gambar wajib diunggah." })
    .refine((file) => file.size <= MAX_FILE_SIZE, `Ukuran gambar maksimal adalah 5MB.`)
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Format gambar tidak didukung (.jpg, .jpeg, .png, .webp).")
});


export async function POST(request: NextRequest) {
  // 1. Otorisasi
  const [user, errorResponse] = await authorizeRequest(request, [1, 2, 3]);
  if (errorResponse) {
    return errorResponse;
  }

  // 2. Ekstraksi data dari FormData
  const formData = await request.formData();
  const dataToValidate = {
    nama_produk: formData.get("nama_produk"),
    deskripsi: formData.get("deskripsi"),
    harga: formData.get("harga"),
    stok: formData.get("stok"),
    nohp: formData.get("nohp"),
    id_sub: formData.get("id_sub"),
    gambar: formData.get("gambar"),
  };
  
  // 3. Validasi dengan Zod
  const validationResult = productSchema.safeParse(dataToValidate);

  if (!validationResult.success) {
    return NextResponse.json(
      { 
        message: "Data tidak valid.",
        errors: validationResult.error.flatten().fieldErrors, // Error terstruktur untuk frontend
      },
      { status: 400 }
    );
  }

  // Data sudah tervalidasi dan tipenya sudah benar (coerced)
  const { gambar: gambarFile, ...productData } = validationResult.data;

  try {
    // 4. Upload gambar ke CDN
    const imageUrl = await uploadToRyzenCDN(gambarFile);
    if (!imageUrl) {
      return NextResponse.json(
        { message: "Gagal mengunggah gambar ke CDN." },
        { status: 500 }
      );
    }

    // 5. Simpan ke Database
    const newProduct = await prisma.tbl_product.create({
      data: {
        nama_produk: productData.nama_produk,
        deskripsi: productData.deskripsi || "",
        harga: productData.harga,
        stok: productData.stok,
        nohp: productData.nohp || "",
        gambar: imageUrl, // URL dari CDN
        id_user: user!.id_user, // ID user yang membuat produk
        tgl_upload: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Produk berhasil dibuat", data: newProduct },
      { status: 201 }
    );

  } catch (error) {
    console.error("Gagal membuat produk:", error);

    // Penanganan error spesifik dari Prisma (contoh: unique constraint)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: "Gagal: Produk dengan nama atau detail serupa sudah ada." },
          { status: 409 } // 409 Conflict
        );
      }
    }
    
    // Error umum
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server saat membuat produk." },
      { status: 500 }
    );
  }
}