import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../app/generated/prisma";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/auth/register/umkm:
 *   post:
 *     summary: Register a new UMKM user
 *     description: Membuat user baru dengan level UMKM. Password tidak di-hash (hanya untuk keperluan pengujian, jangan gunakan di produksi).
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_user
 *               - username
 *               - email
 *               - password
 *               - jk
 *             properties:
 *               nama_user:
 *                 type: string
 *                 description: Nama lengkap user
 *               username:
 *                 type: string
 *                 description: Username unik untuk login
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email user
 *               password:
 *                 type: string
 *                 description: Password user (tidak di-hash)
 *               jk:
 *                 type: string
 *                 description: Jenis kelamin user
 *     responses:
 *       201:
 *         description: User UMKM berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id_user:
 *                       type: integer
 *                     nama_user:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     jk:
 *                       type: string
 *                     id_level:
 *                       type: integer
 *       400:
 *         description: Field tidak lengkap
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       409:
 *         description: Username atau Email sudah digunakan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Terjadi kesalahan pada server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_user, username, email, password, jk } = body;

    if (!nama_user || !username || !email || !password || !jk) {
      return NextResponse.json(
        { message: "Semua field (termasuk jk) harus diisi" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.tbl_user.findFirst({
      where: {
        OR: [{ username: username }, { email: email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username atau Email sudah digunakan" },
        { status: 409 }
      );
    }

    const newUser = await prisma.tbl_user.create({
      data: {
        // id_user will be auto-generated if your schema uses @id @default(autoincrement())
        nama_user,
        username,
        email,
        password: password, // Sesuai permintaan Anda, tanpa hash
        jk, // Field `jk` sekarang ditambahkan
        id_level: 3,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        message: "User UMKM berhasil dibuat (Password tidak di-hash)",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Kesalahan saat registrasi UMKM:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}