import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/verifyToken';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const verificationResult = await verifyToken(request);
  
    if (
      !verificationResult.success ||
      !verificationResult.user ||
      ![1, 2, 3].includes(verificationResult.user.id_level) 
    ) {
      return NextResponse.json(
        { message: verificationResult.error || "Akses ditolak." },
        { status: verificationResult.status || 401 }
      );
    }
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const user = await prisma.tbl_user.findUnique({
      where: { id_user: id },
      select: {
        id_user: true,
        nama_user: true,
        username: true,
        email: true,
        nohp: true,
        jk: true,
        nama_usaha: true,
        status_usaha: true,
        verifiedAt: true,
        tbl_level: true,
        tbl_kategori_usaha: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User fetched successfully', data: user });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch user', error }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const verificationResult = await verifyToken(request);

  if (
    !verificationResult.success ||
    !verificationResult.user ||
    ![1, 2, 3].includes(verificationResult.user.id_level) 
  ) {
    return NextResponse.json(
      { message: verificationResult.error || "Akses ditolak." },
      { status: verificationResult.status || 401 }
    );
  }
  
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { password, ...updateData } = body;

    const updatedUser = await prisma.tbl_user.update({
      where: { id_user: id },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: 'User updated successfully',
      data: userWithoutPassword,
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update user', error }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
        return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    try {
        await prisma.tbl_user.delete({
            where: { id_user: id },
        });
        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to delete user', error }, { status: 500 });
    }
}