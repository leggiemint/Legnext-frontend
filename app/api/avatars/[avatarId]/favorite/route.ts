import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth-standard";
import connectMongo from "@/libs/mongoose";
import Avatar from "@/models/Avatar";

export async function POST(
  req: NextRequest,
  { params }: { params: { avatarId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    
    const avatar = await Avatar.findOne({ 
      _id: params.avatarId,
      userId: session.user.id 
    });

    if (!avatar) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    avatar.isFavorite = !avatar.isFavorite;
    await avatar.save();

    return NextResponse.json({ success: true, isFavorite: avatar.isFavorite });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}