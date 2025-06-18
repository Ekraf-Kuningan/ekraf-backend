import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/mailer";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Meminta reset password
 *     description: Endpoint untuk meminta link reset password berdasarkan email yang terdaftar.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Alamat email pengguna yang ingin mereset password.
 *     responses:
 *       200:
 *         description: Link reset password telah dikirim jika email terdaftar.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Jika email Anda terdaftar, Anda akan menerima link reset password.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email wajib diisi" },
        { status: 400 }
      );
    }

    const user = await prisma.tbl_user.findFirst({
      where: { email: email },
    });

    // Penting: Jangan beri tahu jika email tidak ada untuk alasan keamanan.
    // Cukup kirim respons sukses yang sama.
    if (!user) {
      console.log(`Password reset attempt for non-existent email: ${email}`);
      return NextResponse.json({
        message: "Jika email Anda terdaftar, Anda akan menerima link reset password.",
        success: true,
      }, { status: 200 });
    }
    
    // Kirim email untuk reset password
    await sendEmail({
      email: user.email as string,
      emailType: "RESET",
      userId: user.id_user,
    });

    return NextResponse.json(
      {
        message: "Jika email Anda terdaftar, Anda akan menerima link reset password.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Kesalahan saat meminta reset password:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}
