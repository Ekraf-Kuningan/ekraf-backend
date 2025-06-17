import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const users = await prisma.tbl_user.findMany({
      select: {
        id_user: true,
        nama_user: true,
        username: true,
        email: true,
        nohp: true,
        jk: true,
        nama_usaha: true,
        verifiedAt: true,
        tbl_level: {
          select: {
            level: true,
          },
        },
      },
      orderBy: {
        nama_user: 'asc',
      },
    });

    return NextResponse.json({
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch users', error },
      { status: 500 }
    );
  }
}