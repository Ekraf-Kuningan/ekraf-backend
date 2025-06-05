import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export interface DecodedUserPayload extends JwtPayload {
  id_user: number;
  username: string;
  id_level: number;
  email: string | null;
}

interface VerificationResult {
  success: boolean;
  user?: DecodedUserPayload;
  error?: string;
  status?: number;
}

export async function verifyToken(req: NextRequest): Promise<VerificationResult> {
  if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    return { success: false, error: 'Konfigurasi server tidak lengkap.', status: 500 };
  }

  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Tidak ada token otorisasi atau format salah.', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return { success: false, error: 'Token tidak ditemukan setelah "Bearer ".', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedUserPayload;
    return { success: true, user: decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: 'Token telah kedaluwarsa.', status: 401 };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: 'Token tidak valid.', status: 401 };
    }
    console.error('Kesalahan verifikasi token yang tidak diketahui:', error);
    return { success: false, error: 'Otorisasi gagal karena token bermasalah.', status: 401 };
  }
}
