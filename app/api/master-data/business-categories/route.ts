import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const businessCategories = await prisma.tbl_kategori_usaha.findMany({
      orderBy: {
        nama_kategori: 'asc',
      },
    });

    return NextResponse.json({
      message: 'Business categories fetched successfully',
      data: businessCategories,
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch business categories', error },
      { status: 500 }
    );
  }
}