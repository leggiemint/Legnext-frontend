import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth-standard";
import connectMongo from "@/libs/mongoose";
import Avatar from "@/models/Avatar";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    
    const avatars = await Avatar.find({ 
      userId: session.user.id,
      status: { $in: ['completed', 'processing', 'generating'] }
    })
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json(avatars);
  } catch (error) {
    console.error("Error fetching avatars:", error);
    return NextResponse.json(
      { error: "Failed to fetch avatars" },
      { status: 500 }
    );
  }
}