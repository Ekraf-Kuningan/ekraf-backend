import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (page < 1 || limit < 1) {
    return NextResponse.json(
      { message: 'Page and limit must be positive integers' },
      { status: 400 }
    );
  }
  
  const skip = (page - 1) * limit;

  try {
    const articles = await prisma.tbl_artikel.findMany({
      skip: skip,
      take: limit,
      include: {
        tbl_user: {
          select: {
            nama_user: true,
            email: true,
          }
        }
      },
      orderBy: {
        tanggal_upload: 'desc',
      },
    });

    const totalArticles = await prisma.tbl_artikel.count();

    return NextResponse.json({
      message: 'Articles fetched successfully',
      totalPages: Math.ceil(totalArticles / limit),
      currentPage: page,
      data: articles,
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch articles', error },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      judul, 
      deskripsi_singkat, 
      isi_lengkap, 
      id_user,
      gambar 
    } = body;

    if (!judul || !isi_lengkap || !id_user) {
      return NextResponse.json(
        { message: 'Required fields are missing: judul, isi_lengkap, id_user' },
        { status: 400 }
      );
    }

    const newArticle = await prisma.tbl_artikel.create({
      data: {
        id_artikel: Date.now(), // or use a proper unique ID generator if needed
        judul,
        deskripsi_singkat,
        isi_lengkap,
        id_user,
        gambar,
        tanggal_upload: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Article created successfully', data: newArticle },
      { status: 201 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to create article', error },
      { status: 500 }
    );
  }
}