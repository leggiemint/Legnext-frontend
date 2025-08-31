import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth-standard";
import connectMongo from "@/libs/mongoose";
import Avatar from "@/models/Avatar";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { avatarIds } = await req.json();
    
    if (!avatarIds || !Array.isArray(avatarIds)) {
      return NextResponse.json({ error: "Invalid avatar IDs" }, { status: 400 });
    }

    await connectMongo();
    
    const result = await Avatar.deleteMany({ 
      _id: { $in: avatarIds },
      userId: session.user.id 
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error("Error deleting avatars:", error);
    return NextResponse.json(
      { error: "Failed to delete avatars" },
      { status: 500 }
    );
  }
}