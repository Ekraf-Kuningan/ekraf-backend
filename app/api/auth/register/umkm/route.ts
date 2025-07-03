import { NextRequest, NextResponse } from "next/server";
// Ensure you have the correct path to your generated Prisma Client
import { prisma, temporary_users_gender, temporary_users_business_status } from "@/lib/prisma"; 
import { sendEmail } from "@/lib/mailer";
import { hashPassword } from "@/lib/auth/passwordUtils";
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
 *               - name
 *               - username
 *               - email
 *               - password
 *               - gender
 *               - phone_number
 *             properties:
 *               name:
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
 *               gender:
 *                 type: string
 *                 enum: [Laki-laki, Perempuan]
 *                 example: Laki-laki
 *               phone_number:
 *                 type: string
 *                 example: "08123456789"
 *               business_name:
 *                 type: string
 *                 example: Toko Budi
 *               business_status:
 *                 type: string
 *                 enum: [BARU, SUDAH_LAMA]
 *                 example: BARU
 *               business_category_id:
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
        name, 
        username, 
        email, 
        password, 
        gender, 
        phone_number,
        business_name,
        business_status,
        business_category_id 
    } = body;

    if (!name || !username || !email || !password || !gender || !phone_number) {
      return NextResponse.json(
        { message: "Semua field wajib diisi kecuali data usaha" },
        { status: 400 }
      );
    }
    
    const validGender = gender === "Laki-laki" ? temporary_users_gender.Laki_laki : gender === "Perempuan" ? temporary_users_gender.Perempuan : null;
    if (!validGender) {
        return NextResponse.json(
            { message: "Jenis kelamin tidak valid. Harap gunakan 'Laki-laki' atau 'Perempuan'." },
            { status: 400 }
        );
    }

    let validBusinessStatus = null;
    if (business_status) {
        validBusinessStatus = business_status === "BARU" ? temporary_users_business_status.BARU : business_status === "SUDAH_LAMA" ? temporary_users_business_status.SUDAH_LAMA : null;
        if (!validBusinessStatus) {
            return NextResponse.json(
                { message: "Status usaha tidak valid. Harap gunakan 'BARU' atau 'SUDAH_LAMA'." },
                { status: 400 }
            );
        }
    }

    const existingUser = await prisma.users.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username atau Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const existingTempUser = await prisma.temporary_users.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingTempUser) {
      return NextResponse.json(
        { message: "Username atau Email sudah digunakan dan menunggu verifikasi." },
        { status: 409 }
      );
    }

    // Hash the password before storing
    const hashedPassword = await hashPassword(password);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 3600000);

    const newUserTemp = await prisma.temporary_users.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword, 
        gender: validGender,
        phone_number,
        level_id: 3,
        verificationToken,
        verificationTokenExpiry,
        business_name,
        business_status: validBusinessStatus,
        business_category_id: business_category_id ? parseInt(business_category_id) : null,
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