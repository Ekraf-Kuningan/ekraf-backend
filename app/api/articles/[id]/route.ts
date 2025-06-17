import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/verifyToken";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const article = await prisma.tbl_artikel.findUnique({
      where: { id_artikel: id },
      include: {
        tbl_user: {
          select: {
            nama_user: true,
            email: true
          }
        }
      }
    });

    if (!article) {
      return NextResponse.json(
        { message: `Article with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Article fetched successfully",
      data: article
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch article", error },
      { status: 500 }
    );
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

//   const user = verificationResult.user as DecodedUserPayload;
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { judul, deskripsi_singkat, isi_lengkap, gambar } = body;

    const updatedArticle = await prisma.tbl_artikel.update({
      where: { id_artikel: id },
      data: {
        judul,
        deskripsi_singkat,
        isi_lengkap,
        gambar
      }
    });

    return NextResponse.json({
      message: "Article updated successfully",
      data: updatedArticle
    });
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to update article with ID ${id}`, error },
      { status: 500 }
    );
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
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Invalid ID format" }, { status: 400 });
  }

  try {
    await prisma.tbl_artikel.delete({
      where: { id_artikel: id }
    });

    return NextResponse.json({
      message: `Article with ID ${id} deleted successfully`
    });
  } catch (error) {
    return NextResponse.json(
      { message: `Failed to delete article with ID ${id}`, error },
      { status: 500 }
    );
  }
}
