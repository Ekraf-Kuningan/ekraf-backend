import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: Variabel lingkungan JWT_SECRET belum diatur!");
}

const levelMap: { [key: string]: number } = {
  superadmin: 1,
  admin: 2,
  umkm: 3
};

/**
 * @swagger
 * /api/auth/login/{level}:
 *   post:
 *     summary: Melakukan login berdasarkan level user
 *     description: |
 *       Endpoint untuk melakukan autentikasi user berdasarkan level tertentu.
 *       Mendukung login menggunakan username atau email.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *           enum: [superadmin, admin, umkm]
 *         description: Nama level user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *               - password
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: Username atau email user
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 description: Password user
 *                 example: rahasiaku123
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login berhasil
 *                 token:
 *                   type: string
 *                   description: JWT token autentikasi
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     level_id:
 *                       type: integer
 *                       example: 2
 *                     level:
 *                       type: string
 *                       example: admin
 *                     email:
 *                       type: string
 *                       example: johndoe@email.com
 *       400:
 *         description: Request body tidak valid atau field kurang
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username/Email dan password diperlukan
 *       401:
 *         description: Kredensial salah
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Kredensial salah untuk level admin
 *       404:
 *         description: Tipe login tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tipe login 'admin' tidak valid.
 *       500:
 *         description: Kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Terjadi kesalahan pada server
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ level: string }> }
) {
  if (!JWT_SECRET) {
    return NextResponse.json(
      {
        message: "Konfigurasi server tidak lengkap. JWT Secret tidak ditemukan.",
      },
      { status: 500 }
    );
  }

  const { level } = await params;
  const id_level = levelMap[level];

  if (!id_level) {
    return NextResponse.json(
      { message: `Tipe login '${level}' tidak valid.` },
      { status: 404 }
    );
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body tidak valid atau bukan JSON." },
      { status: 400 }
    );
  }

  const { usernameOrEmail, password } = requestBody;

  if (!usernameOrEmail || !password) {
    return NextResponse.json(
      { message: "Username/Email dan password diperlukan" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.users.findFirst({
      where: {
        AND: [
          {
            OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
          },
          {
            level_id: id_level,
          },
        ],
      },
      include: {
        levels: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: `Kredensial salah untuk level ${level}` },
        { status: 401 }
      );
    }

    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: `Kredensial salah untuk level ${level}` },
        { status: 401 }
      );
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      level_id: user.level_id,
      level: user.levels.name,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "365d",
    });

    return NextResponse.json(
      {
        message: "Login berhasil",
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          level_id: user.level_id,
          level: user.levels.name,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Kesalahan saat login ${level}:`, error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}
