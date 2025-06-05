// File: app/api/auth/login/route.ts (Contoh path untuk App Router)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../app/generated/prisma'; // Sesuaikan path jika struktur folder berbeda
import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs'; // bcrypt tidak lagi digunakan untuk perbandingan

const prisma = new PrismaClient();

// Pastikan JWT_SECRET sudah diatur di .env
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Ini akan menyebabkan error saat build jika JWT_SECRET tidak ada, yang mana baik.
  // Sebaiknya tangani ini dengan lebih baik di produksi, mungkin dengan fallback atau log error yang lebih jelas.
  console.error('FATAL ERROR: Variabel lingkungan JWT_SECRET belum diatur!');
  // throw new Error('Harap definisikan variabel lingkungan JWT_SECRET di .env');
}

interface LoginResponseData {
  token?: string;
  message: string;
  user?: {
    id_user: number;
    nama_user: string | null;
    username: string;
    id_level: number;
    email: string | null;
  };
}

export async function POST(req: NextRequest): Promise<NextResponse<LoginResponseData | { message: string }>> {
  if (!JWT_SECRET) {
    // Penanganan jika JWT_SECRET masih belum terdefinisi saat runtime
    // (meskipun pengecekan di atas seharusnya sudah menangkap ini saat build/startup)
    return NextResponse.json({ message: 'Konfigurasi server tidak lengkap. JWT Secret tidak ditemukan.' }, { status: 500 });
  }

  let requestBody;
  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json({ message: 'Request body tidak valid atau bukan JSON.' }, { status: 400 });
  }

  const { usernameOrEmail, password } = requestBody;

  if (!usernameOrEmail || !password) {
    return NextResponse.json({ message: 'Username/Email dan password diperlukan' }, { status: 400 });
  }

  try {
    const user = await prisma.tbl_user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Username/Email atau password salah' }, { status: 401 });
    }

    // PERINGATAN: Perbandingan password plain text - SANGAT TIDAK AMAN!
    // Password dari input dibandingkan langsung dengan password di database.
    const isPasswordValid = user.password === password;

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Username/Email atau password salah' }, { status: 401 });
    }

    // Buat token JWT
    const tokenPayload = {
      id_user: user.id_user,
      username: user.username,
      id_level: user.id_level,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '1d', // Token berlaku selama 1 hari, sesuaikan sesuai kebutuhan
    });

    return NextResponse.json({
      message: 'Login berhasil',
      token,
      user: {
        id_user: user.id_user,
        nama_user: user.nama_user,
        username: user.username,
        id_level: user.id_level,
        email: user.email,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Kesalahan saat login:', error);
    // Hindari mengirim detail error internal ke client di produksi
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  } finally {
    // Penting untuk memutuskan koneksi Prisma setelah selesai
    // Namun, dalam konteks serverless/edge, manajemen koneksi mungkin berbeda.
    // Untuk API route Next.js standar, ini masih praktik yang baik.
    await prisma.$disconnect().catch(disconnectError => {
        console.error('Kesalahan saat disconnect Prisma:', disconnectError);
    });
  }
}