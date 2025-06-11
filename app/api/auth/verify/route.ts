import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../../app/generated/prisma";
const prisma = new PrismaClient();
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: "Token verifikasi tidak ditemukan." },
        { status: 400 }
      );
    }

    const tempUser = await prisma.tbl_user_temp.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!tempUser) {
      return NextResponse.json(
        { message: "Token tidak valid atau telah digunakan." },
        { status: 400 }
      );
    }

    const expirationTime = new Date(tempUser.createdAt.getTime() + 5 * 60 * 1000);
    if (new Date() > expirationTime) {
      // Secara opsional, hapus token yang sudah kedaluwarsa di sini
      await prisma.tbl_user_temp.delete({
        where: { id: tempUser.id },
      });
      return NextResponse.json(
        { message: "Token telah kedaluwarsa." },
        { status: 400 }
      );
    }

    await prisma.tbl_user.create({
      data: {
        nama_user: tempUser.nama_user,
        username: tempUser.username,
        email: tempUser.email,
        password: tempUser.password,
        jk: tempUser.jk,
        nohp: tempUser.nohp,
        id_level: tempUser.id_level,
        verifiedAt: new Date(),
      },
    });

    await prisma.tbl_user_temp.delete({
      where: { id: tempUser.id },
    });

    // Arahkan pengguna ke halaman login atau halaman sukses
    return NextResponse.redirect('ekraf://verification-success');
    // return NextResponse.json(
    //     {
    //       message: "Email berhasil diverifikasi!",
    //       success: true
    //     },
    //     { status: 200 }
    //   );

  } catch (error: unknown) {
    if (error instanceof Error) {
        // Handle potential unique constraint violation if user tries to verify twice quickly
        if (error.message.includes('Unique constraint failed')) {
            return NextResponse.json({ message: "Pengguna dengan email atau username ini sudah diverifikasi." }, { status: 409 });
        }
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(console.error);
  }
}