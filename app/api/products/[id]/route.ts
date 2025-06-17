import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const product = await prisma.tbl_product.findUnique({
      where: { id_produk: id },
      include: {
        tbl_subsektor: true,
        tbl_user: { select: { nama_user: true, email: true } },
        tbl_olshop_link: true,
      },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product fetched successfully', data: product });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch product', error }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updatedProduct = await prisma.tbl_product.update({
      where: { id_produk: id },
      data: body,
    });

    return NextResponse.json({ message: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update product', error }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    await prisma.tbl_product.delete({
      where: { id_produk: id },
    });
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete product', error }, { status: 500 });
  }
}