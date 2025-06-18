import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password pengguna
 *     description: Endpoint untuk mereset password pengguna menggunakan token yang telah dikirimkan melalui email.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token reset password yang diterima melalui email.
 *                 example: "abc123xyz"
 *               password:
 *                 type: string
 *                 description: Password baru yang akan di-set.
 *                 example: "passwordBaru123"
 *     responses:
 *       200:
 *         description: Password berhasil direset.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password Anda telah berhasil direset."
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Token tidak valid atau sudah kedaluwarsa, atau input tidak lengkap.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token dan password baru wajib diisi" },
        { status: 400 }
      );
    }

    // Cari user berdasarkan token dan pastikan token belum kedaluwarsa
    const user = await prisma.tbl_user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: {
          gt: new Date(), // Lebih besar dari waktu sekarang
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Token tidak valid atau sudah kedaluwarsa." },
        { status: 400 }
      );
    }

    // Update password tanpa hash dan hapus token reset
    await prisma.tbl_user.update({
      where: { id_user: user.id_user },
      data: {
        password: password,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    return NextResponse.json(
      {
        message: "Password Anda telah berhasil direset.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Kesalahan saat mereset password:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}

