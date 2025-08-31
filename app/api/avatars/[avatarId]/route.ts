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

    const avatar = await prisma.avatar.findFirst({
      where: {
        id: params.avatarId,
        userId: session.user.id
      }
    });

    if (!avatar) {
      return NextResponse.json(
        { error: "Avatar not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(avatar);
  } catch (error) {
    console.error("Error fetching avatar:", error);
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
    const { name, isFavorite } = body;

    const avatar = await prisma.avatar.findFirst({
      where: {
        id: params.avatarId,
        userId: session.user.id
      }
    });

    if (!avatar) {
      return NextResponse.json(
        { error: "Avatar not found" }, 
        { status: 404 }
      );
    }

    const updatedAvatar = await prisma.avatar.update({
      where: { id: params.avatarId },
      data: {
        ...(name !== undefined && { name }),
        ...(isFavorite !== undefined && { isFavorite })
      }
    });

    return NextResponse.json(updatedAvatar);
  } catch (error) {
    console.error("Error updating avatar:", error);
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

    const avatar = await prisma.avatar.findFirst({
      where: {
        id: params.avatarId,
        userId: session.user.id
      }
    });

    if (!avatar) {
      return NextResponse.json(
        { error: "Avatar not found" }, 
        { status: 404 }
      );
    }

    await prisma.avatar.delete({
      where: { id: params.avatarId }
    });

    // TODO: Also delete files from S3/storage if needed

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
