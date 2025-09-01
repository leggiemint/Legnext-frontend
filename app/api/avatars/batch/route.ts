import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { imageIds } = body;

    if (!imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: "imageIds array is required" }, 
        { status: 400 }
      );
    }

    // Verify all images belong to the user
    const images = await prisma.midjourneyImage.findMany({
      where: {
        id: { in: imageIds },
        userId: session.user.id
      },
      select: { id: true }
    });

    if (images.length !== imageIds.length) {
      return NextResponse.json(
        { error: "Some images not found or unauthorized" }, 
        { status: 404 }
      );
    }

    // Delete the images
    await prisma.midjourneyImage.deleteMany({
      where: {
        id: { in: imageIds },
        userId: session.user.id
      }
    });

    // TODO: Also delete files from S3/storage if needed

    return NextResponse.json({ 
      success: true, 
      deletedCount: images.length 
    });
  } catch (error) {
    console.error("Error batch deleting images:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}