import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const productId = parseInt(params.id, 10);
  if (isNaN(productId)) {
    return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
  }

  try {
    const links = await prisma.tbl_olshop_link.findMany({
      where: { id_produk: productId },
    });
    return NextResponse.json({ message: 'Links fetched successfully', data: links });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch links', error }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const productId = parseInt(params.id, 10);
  if (isNaN(productId)) {
    return NextResponse.json({ message: 'Invalid Product ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { nama_platform, url } = body;

    if (!nama_platform || !url) {
      return NextResponse.json({ message: 'Required fields missing' }, { status: 400 });
    }

    const newLink = await prisma.tbl_olshop_link.create({
      data: {
        id_produk: productId,
        nama_platform,
        url,
      },
    });

    return NextResponse.json({ message: 'Link created successfully', data: newLink }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create link', error }, { status: 500 });
  }
}