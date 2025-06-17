import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const userLevels = await prisma.tbl_level.findMany({
      orderBy: {
        id_level: 'asc',
      },
    });

    return NextResponse.json({
      message: 'User levels fetched successfully',
      data: userLevels,
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch user levels', error },
      { status: 500 }
    );
  }
}