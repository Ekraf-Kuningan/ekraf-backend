/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const searchQuery = searchParams.get('q');
  const subSectorId = searchParams.get('subsector');

  const whereClause: Record<string, unknown> = {};
  if (searchQuery) {
    whereClause.nama_produk = {
      contains: searchQuery,
    };
  }
  if (subSectorId && !isNaN(parseInt(subSectorId))) {
    whereClause.id_sub = parseInt(subSectorId);
  }

  const skip = (page - 1) * limit;

  try {
    const products = await prisma.tbl_product.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      include: {
        tbl_subsektor: true,
        tbl_user: {
          select: {
            nama_user: true,
          },
        },
      },
      orderBy: {
        tgl_upload: 'desc',
      },
    });

    const totalProducts = await prisma.tbl_product.count({ where: whereClause });

    return NextResponse.json({
      message: 'Products fetched successfully',
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      data: products,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch products', error },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nama_produk,
      deskripsi,
      harga,
      stok,
      nohp,
      id_sub,
      id_user,
      gambar,
    } = body;

    if (!nama_produk || !harga || !stok || !id_sub || !id_user) {
      return NextResponse.json(
        { message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const newProduct = await prisma.tbl_product.create({
      data: {
        ...body,
        tgl_upload: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Product created successfully', data: newProduct },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create product', error },
      { status: 500 }
    );
  }
}