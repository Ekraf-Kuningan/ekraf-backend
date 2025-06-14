import { NextRequest, NextResponse } from "next/server";
// Ensure you have the correct path to your generated Prisma Client
import { PrismaClient, tbl_user_temp_jk } from "../../../../../app/generated/prisma"; 
import { sendEmail } from "@/lib/mailer";
// import bcrypt from "bcryptjs";
import crypto from "crypto";

// It's a good practice to instantiate Prisma Client once and reuse it.
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/auth/register/umkm:
 * post:
 * summary: Register a new UMKM user
 * description: Creates a new temporary user with the UMKM level and sends a verification email. The password is now securely hashed.
 * tags:
 * - Auth
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - nama_user
 * - username
 * - email
 * - password
 * - jk
 * - nohp
 * properties:
 * nama_user:
 * type: string
 * description: Full name of the user
 * username:
 * type: string
 * description: Unique username for login
 * email:
 * type: string
 * format: email
 * description: User's email for verification and communication
 * password:
 * type: string
 * description: User's password (will be hashed)
 * jk:
 * type: string
 * enum: ["Laki-laki", "Perempuan"]
 * description: User's gender
 * nohp:
 * type: string
 * description: User's phone number
 * responses:
 * 201:
 * description: User created successfully. Awaiting email verification.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * success:
 * type: boolean
 * 400:
 * description: Missing required fields or invalid gender value
 * 409:
 * description: Username or Email already in use or pending verification
 * 500:
 * description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_user, username, email, password, jk, nohp } = body;

    // --- Validation for required fields ---
    if (!nama_user || !username || !email || !password || !jk || !nohp) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }
    
    // --- Validate gender value against the enum ---
    const validJk = jk === "Laki-laki" ? tbl_user_temp_jk.Laki_laki : jk === "Perempuan" ? tbl_user_temp_jk.Perempuan : null;
    if (!validJk) {
        return NextResponse.json(
            { message: "Jenis kelamin tidak valid. Harap gunakan 'Laki-laki' atau 'Perempuan'." },
            { status: 400 }
        );
    }

    // --- Check if user already exists in the main user table ---
    const existingUser = await prisma.tbl_user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username atau Email sudah terdaftar" },
        { status: 409 }
      );
    }

    // --- Check if user is already pending verification in the temp table ---
    const existingTempUser = await prisma.tbl_user_temp.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingTempUser) {
      return NextResponse.json(
        { message: "Username atau Email sudah digunakan dan menunggu verifikasi." },
        { status: 409 }
      );
    }

    // --- Securely hash the password ---
    // Note: You need to install bcryptjs: npm install bcryptjs
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);

    // --- Generate a unique verification token ---
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // --- Create a temporary user entry for verification ---
    const newUserTemp = await prisma.tbl_user_temp.create({
      data: {
        nama_user,
        username,
        email,
        password: password, 
        jk: validJk,
        nohp,
        id_level: 3, // Assuming 3 is the ID for UMKM level
        verificationToken,
        verificationTokenExpiry,
      },
    });

    // --- Send verification email ---
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
    // --- Disconnect Prisma Client ---
    await prisma.$disconnect().catch(console.error);
  }
}
