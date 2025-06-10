import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ message: "Token tidak ditemukan" }, { status: 400 });
        }

        const tempUser = await prisma.tbl_user_temp.findFirst({
            where: {
                verificationToken: token,
                createdAt: {
                    gte: new Date(Date.now() - 5 * 60 * 1000) // Check if created within last 5 minutes
                }
            }
        });

        if (!tempUser) {
            return NextResponse.json({ message: "Token tidak valid atau telah kedaluwarsa" }, { status: 400 });
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
                verifiedAt: new Date()
            }
        });

        await prisma.tbl_user_temp.delete({
            where: { id: tempUser.id }
        });

        return NextResponse.json({
            message: "Email berhasil diverifikasi!",
            success: true
        }, { status: 200 });


    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    } finally {
        await prisma.$disconnect().catch(console.error);
    }
}
