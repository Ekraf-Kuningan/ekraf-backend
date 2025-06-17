import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const userId = parseInt(params.id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  try {
    const articles = await prisma.tbl_artikel.findMany({
      where: { id_user: userId },
      orderBy: {
        tanggal_upload: 'desc',
      },
    });

    return NextResponse.json({
      message: `Articles for user ${userId} fetched successfully`,
      data: articles,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch articles', error }, { status: 500 });
  }
}