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
    const products = await prisma.tbl_product.findMany({
      where: { id_user: userId },
      orderBy: {
        tgl_upload: 'desc',
      },
    });

    return NextResponse.json({
      message: `Products for user ${userId} fetched successfully`,
      data: products,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch products', error }, { status: 500 });
  }
}