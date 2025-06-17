import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/verifyToken";

export async function GET(req: NextRequest) {
  const verificationResult = await verifyToken(req);

  if (
    !verificationResult.success ||
    !verificationResult.user ||
    ![1, 2].includes(verificationResult.user.id_level) 
  ) {
    return NextResponse.json(
      { message: verificationResult.error || "Akses ditolak." },
      { status: verificationResult.status || 401 }
    );
  }

  try {
    const users = await prisma.tbl_user.findMany({
      select: {
        id_user: true,
        nama_user: true,
        username: true,
        email: true,
        nohp: true,
        jk: true,
        nama_usaha: true,
        verifiedAt: true,
        tbl_level: {
          select: {
            level: true
          }
        }
      },
      orderBy: {
        nama_user: "asc"
      }
    });

    return NextResponse.json({
      message: "Users fetched successfully",
      data: users
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch users", error },
      { status: 500 }
    );
  }
}
