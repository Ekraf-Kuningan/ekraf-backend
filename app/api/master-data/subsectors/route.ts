import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const subsectors = await prisma.tbl_subsektor.findMany({
      orderBy: {
        sub_sektor: 'asc',
      },
    });

    return NextResponse.json({
      message: 'Subsectors fetched successfully',
      data: subsectors,
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch subsectors', error },
      { status: 500 }
    );
  }
}