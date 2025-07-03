import { NextRequest, NextResponse } from "next/server";
import { verifyToken, DecodedUserPayload } from "./verifyToken";

/**
 * Memverifikasi token dan otorisasi peran pengguna.
 * @returns Tuple: [user, errorResponse].
 * - Jika berhasil: [DecodedUserPayload, null]
 * - Jika gagal: [null, NextResponse]
 */
export async function authorizeRequest(
  req: NextRequest,
  allowedRoles: number[]
): Promise<[DecodedUserPayload | null, NextResponse | null]> {
  const verificationResult = await verifyToken(req);
  const user = verificationResult.user as DecodedUserPayload;
  // Gagal karena token tidak ada, tidak valid, atau kedaluwarsa
  if (!verificationResult.success || !user) {
    const errorResponse = NextResponse.json(
      { message: verificationResult.error ?? "Akses ditolak." },
      { status: verificationResult.status ?? 401 }
    );
    return [null, errorResponse];
  }

  // Gagal karena peran/level tidak diizinkan
  if (!allowedRoles.includes(user.level_id)) {
    const errorResponse = NextResponse.json(
      { message: "Anda tidak memiliki izin untuk mengakses sumber daya ini." },
      { status: 403 } // 403 Forbidden adalah status yang lebih tepat untuk otorisasi
    );
    return [null, errorResponse];
  }

  // Jika semua pemeriksaan berhasil, kembalikan data user dan null untuk error
  return [user, null];
}