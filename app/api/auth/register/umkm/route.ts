import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../../app/generated/prisma";
import { sendEmail } from "@/lib/mailer";

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
 *               - nohp
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
 *               nohp:
 *                 type: string
 *                 description: Nomor HP user
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
 *                     nohp:
 *                        type: string
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
    const { nama_user, username, email, password, jk, nohp } = body;

    if (!nama_user || !username || !email || !password || !jk) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.tbl_user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username atau Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const existingTempUser = await prisma.tbl_user_temp.findFirst({
        where: { OR: [{ username }, { email }] },
    });

    if (existingTempUser) {
        return NextResponse.json(
          { message: "Username atau Email sudah digunakan dan menunggu verifikasi." },
          { status: 409 }
        );
    }

    const newUserTemp = await prisma.tbl_user_temp.create({
      data: {
      nama_user,
      username,
      email,
      nohp,
      password, 
      jk,
      id_level: 3, 
      verificationToken: '', 
      },
    });

    await sendEmail({
        email,
        emailType: "VERIFY",
        userId: newUserTemp.id
    });

    return NextResponse.json(
      {
        message: "User berhasil dibuat. Silakan cek email Anda untuk verifikasi.",
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Kesalahan saat registrasi:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}