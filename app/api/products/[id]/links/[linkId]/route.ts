import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/verifyToken';

interface RouteParams {
  params: { id: string; linkId: string };
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
  const linkId = parseInt(params.linkId, 10);
  if (isNaN(linkId)) {
    return NextResponse.json({ message: 'Invalid Link ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updatedLink = await prisma.tbl_olshop_link.update({
      where: { id_link: linkId },
      data: body,
    });
    return NextResponse.json({ message: 'Link updated successfully', data: updatedLink });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update link', error }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
  const linkId = parseInt(params.linkId, 10);
  if (isNaN(linkId)) {
    return NextResponse.json({ message: 'Invalid Link ID' }, { status: 400 });
  }

  try {
    await prisma.tbl_olshop_link.delete({
      where: { id_link: linkId },
    });
    return NextResponse.json({ message: 'Link deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete link', error }, { status: 500 });
  }
}