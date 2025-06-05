import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, DecodedUserPayload } from '../../../lib/verifyToken';
// import { PrismaClient } from '../../../../app/generated/prisma'; // Aktifkan jika Anda perlu query database

// const prisma = new PrismaClient(); // Aktifkan jika Anda perlu query database

/**
 * @swagger
 * /api/data-saya:
 *   get:
 *     summary: Mendapatkan data pengguna yang telah diverifikasi token.
 *     description: Endpoint ini mengembalikan data pengguna yang telah diverifikasi melalui token JWT. Jika token tidak valid atau tidak ada, akses akan ditolak.
 *     tags:
 *       - Data Saya
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data pengguna yang berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Halo johndoe! Ini adalah data Anda yang dilindungi.
 *                 infoPengguna:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     level:
 *                       type: integer
 *                       example: 2
 *                     email:
 *                       type: string
 *                       example: johndoe@email.com
 *                 dataContohLain:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       deskripsi:
 *                         type: string
 *                         example: Informasi rahasia A
 *       401:
 *         description: Token tidak valid atau tidak ada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Akses ditolak.
 *       500:
 *         description: Terjadi kesalahan pada server saat mengambil data dari database.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gagal mengambil data dari database.
 */
export async function GET(req: NextRequest) {
  const verificationResult = await verifyToken(req);

  if (!verificationResult.success || !verificationResult.user) {
    return NextResponse.json(
      { message: verificationResult.error || 'Akses ditolak.' },
      { status: verificationResult.status || 401 }
    );
  }

  const user = verificationResult.user as DecodedUserPayload;


  // Contoh pengambilan data dari database (jika diperlukan)
  // try {
  //   const articles = await prisma.tbl_artikel.findMany({
  //     where: {
  //       id_user: user.id_user
  //     }
  //   });
  //   await prisma.$disconnect();
  //   return NextResponse.json({ 
  //     message: `Halo ${user.username}! Ini adalah data artikel Anda.`,
  //     userData: user,
  //     articles: articles 
  //   }, { status: 200 });
  // } catch (dbError) {
  //   console.error("Database error:", dbError);
  //   await prisma.$disconnect();
  //   return NextResponse.json({ message: "Gagal mengambil data dari database." }, { status: 500 });
  // }


  const protectedData = {
    message: `Halo ${user.username}! Ini adalah data Anda yang dilindungi.`,
    infoPengguna: {
      id: user.id_user,
      username: user.username,
      level: user.id_level,
      email: user.email
    },
    dataContohLain: [
      { id: 1, deskripsi: "Informasi rahasia A" },
      { id: 2, deskripsi: "Detail penting B" }
    ]
  };

  return NextResponse.json(protectedData, { status: 200 });
}