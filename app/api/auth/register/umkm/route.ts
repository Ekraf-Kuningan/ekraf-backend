import { NextRequest, NextResponse } from "next/server";
// Ensure you have the correct path to your generated Prisma Client
import { prisma, tbl_user_temp_jk, tbl_user_status_usaha } from "@/lib/prisma"; 
import { sendEmail } from "@/lib/mailer";
// import bcrypt from "bcryptjs";
import crypto from "crypto";

// It's a good practice to instantiate Prisma Client once and reuse it.

/**
 * @swagger
 * /api/auth/register/umkm:
 *   post:
 *     summary: Registrasi user UMKM baru
 *     description: Membuat user baru pada sistem UMKM dan mengirim email verifikasi.
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
 *                 example: Budi Santoso
 *               username:
 *                 type: string
 *                 example: budisantoso
 *               email:
 *                 type: string
 *                 format: email
 *                 example: budi@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: rahasia123
 *               jk:
 *                 type: string
 *                 enum: [Laki-laki, Perempuan]
 *                 example: Laki-laki
 *               nohp:
 *                 type: string
 *                 example: "08123456789"
 *               nama_usaha:
 *                 type: string
 *                 example: Toko Budi
 *               status_usaha:
 *                 type: string
 *                 enum: [BARU, SUDAH_LAMA]
 *                 example: BARU
 *               id_kategori_usaha:
 *                 type: string
 *                 example: "1"
 *     responses:
 *       201:
 *         description: User berhasil dibuat dan email verifikasi dikirim.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User berhasil dibuat. Silakan cek email Anda untuk verifikasi.
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Permintaan tidak valid (field wajib tidak diisi atau format salah).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Semua field wajib diisi kecuali data usaha
 *       409:
 *         description: Username atau email sudah terdaftar/menunggu verifikasi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username atau Email sudah terdaftar
 *       500:
 *         description: Terjadi kesalahan pada server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Terjadi kesalahan pada server
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
        nama_user, 
        username, 
        email, 
        password, 
        jk, 
        nohp,
        nama_usaha,
        status_usaha,
        id_kategori_usaha 
    } = body;

    if (!nama_user || !username || !email || !password || !jk || !nohp) {
      return NextResponse.json(
        { message: "Semua field wajib diisi kecuali data usaha" },
        { status: 400 }
      );
    }
    
    const validJk = jk === "Laki-laki" ? tbl_user_temp_jk.Laki_laki : jk === "Perempuan" ? tbl_user_temp_jk.Perempuan : null;
    if (!validJk) {
        return NextResponse.json(
            { message: "Jenis kelamin tidak valid. Harap gunakan 'Laki-laki' atau 'Perempuan'." },
            { status: 400 }
        );
    }

    let validStatusUsaha = null;
    if (status_usaha) {
        validStatusUsaha = status_usaha === "BARU" ? tbl_user_status_usaha.BARU : status_usaha === "SUDAH_LAMA" ? tbl_user_status_usaha.SUDAH_LAMA : null;
        if (!validStatusUsaha) {
            return NextResponse.json(
                { message: "Status usaha tidak valid. Harap gunakan 'BARU' atau 'SUDAH_LAMA'." },
                { status: 400 }
            );
        }
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

    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 3600000);

    const newUserTemp = await prisma.tbl_user_temp.create({
      data: {
        nama_user,
        username,
        email,
        password: password, 
        jk: validJk,
        nohp,
        id_level: 3,
        verificationToken,
        verificationTokenExpiry,
        nama_usaha,
        status_usaha: validStatusUsaha,
        id_kategori_usaha: id_kategori_usaha ? parseInt(id_kategori_usaha) : null,
      },
    });

    await sendEmail({
        email,
        emailType: "VERIFY",
        userId: newUserTemp.id,
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
