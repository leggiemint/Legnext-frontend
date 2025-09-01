import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { avatarId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const image = await prisma.midjourneyImage.findFirst({
      where: {
        id: params.avatarId,
        userId: session.user.id
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { avatarId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { prompt, status, isFavorite } = body;

    const image = await prisma.midjourneyImage.findFirst({
      where: {
        id: params.avatarId,
        userId: session.user.id
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" }, 
        { status: 404 }
      );
    }

    const updatedImage = await prisma.midjourneyImage.update({
      where: { id: params.avatarId },
      data: {
        ...(prompt !== undefined && { prompt }),
        ...(status !== undefined && { status }),
        ...(isFavorite !== undefined && { isFavorite })
      }
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { avatarId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const image = await prisma.midjourneyImage.findFirst({
      where: {
        id: params.avatarId,
        userId: session.user.id
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: "Image not found" }, 
        { status: 404 }
      );
    }

    await prisma.midjourneyImage.delete({
      where: { id: params.avatarId }
    });

    // TODO: Also delete files from S3/storage if needed

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
