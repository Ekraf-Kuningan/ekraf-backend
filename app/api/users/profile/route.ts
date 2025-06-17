import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react'; // Contoh: menggunakan next-auth
import { verifyToken } from '@/lib/verifyToken';

async function getUserIdFromSession(request: Request): Promise<number | null> {
  // Logika untuk mendapatkan ID pengguna dari sesi.
  // Ini adalah placeholder. Anda harus mengimplementasikannya
  // sesuai dengan library autentikasi Anda (misalnya Next-Auth, Clerk, dll).
  // Contoh dengan Next-Auth:
  // const session = await getSession({ req: request });
  // return session?.user?.id || null;
  return 1; // Ganti dengan ID pengguna dinamis dari sesi
}


export async function GET(request: Request) {
  const userId = await getUserIdFromSession(request);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProfile = await prisma.tbl_user.findUnique({
      where: { id_user: userId },
      select: {
        id_user: true,
        nama_user: true,
        username: true,
        email: true,
        nohp: true,
        jk: true,
        nama_usaha: true,
        status_usaha: true,
        verifiedAt: true,
        tbl_level: true,
        tbl_kategori_usaha: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile fetched successfully', data: userProfile });

  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch profile', error }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update the authenticated user's profile
 *     description: Updates the profile information of the currently authenticated user. Only users with id_level 1, 2, or 3 are authorized.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *                 description: User's name
 *               email:
 *                 type: string
 *                 description: User's email
 *               [other fields]:
 *                 type: string
 *                 description: Other updatable profile fields
 *             example:
 *               nama: "John Doe"
 *               email: "john@example.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   description: Updated user profile (without password)
 *       401:
 *         description: Unauthorized or access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to update profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
export async function PUT(request: NextRequest) {
  const verificationResult = await verifyToken(request);
  
    if (
      !verificationResult.success ||
      !verificationResult.user ||
      ![1, 2, 3].includes(verificationResult.user.id_level) 
    ) {
      return NextResponse.json(
        { message: verificationResult.error || "Akses ditolak." },
        { status: verificationResult.status || 401 }
      );
    }

  try {
    const body = await request.json();
    const { password, id_level, username, ...updateData } = body;

    const updatedProfile = await prisma.tbl_user.update({
      where: { id_user: userId },
      data: updateData,
    });

    const { password: _, ...profileWithoutPassword } = updatedProfile;

    return NextResponse.json({
      message: 'Profile updated successfully',
      data: profileWithoutPassword,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update profile', error }, { status: 500 });
  }
}