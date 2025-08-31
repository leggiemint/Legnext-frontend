import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth-standard";
import connectMongo from "@/libs/mongoose";
import Avatar from "@/models/Avatar";

export async function POST(req: NextRequest) {
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
    
    const avatars = await Avatar.find({ 
      _id: { $in: avatarIds },
      userId: session.user.id 
    }).lean();

    if (avatars.length === 0) {
      return NextResponse.json({ error: "No avatars found" }, { status: 404 });
    }

    // For now, return the download URLs
    // In a real implementation, you would create a zip file
    const downloadData = avatars.map(avatar => ({
      name: avatar.name,
      originalUrl: avatar.images?.original?.url,
      thumbnailUrl: avatar.images?.thumbnail?.url,
    }));

    return NextResponse.json({ avatars: downloadData });
  } catch (error) {
    console.error("Error preparing download:", error);
    return NextResponse.json(
      { error: "Failed to prepare download" },
      { status: 500 }
    );
  }
}