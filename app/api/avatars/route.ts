import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import { consumeCredits, incrementAvatarCount } from "@/libs/user-service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const avatars = await prisma.avatar.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["completed", "generating", "processing"] }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        style: true,
        status: true,
        isFavorite: true,
        downloadCount: true,
        images: true,
        createdAt: true
      }
    });

    return NextResponse.json(avatars);
  } catch (error) {
    console.error("Error fetching avatars:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, prompt, style } = body;

    if (!prompt || !style) {
      return NextResponse.json(
        { error: "Prompt and style are required" }, 
        { status: 400 }
      );
    }

    // Check if user has enough credits (5 credits for avatar generation)
    const creditResult = await consumeCredits(
      session.user.id, 
      5, 
      `Avatar generation: ${name || "Untitled"}`
    );

    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error || "Insufficient credits" }, 
        { status: 400 }
      );
    }

    // Create avatar record
    const avatar = await prisma.avatar.create({
      data: {
        userId: session.user.id,
        name: name || "Untitled Avatar",
        prompt,
        style,
        status: "generating"
      }
    });

    // Increment user's avatar count
    await incrementAvatarCount(session.user.id);

    // TODO: Add your AI avatar generation logic here
    // For now, we'll simulate generation with a completed status
    setTimeout(async () => {
      await prisma.avatar.update({
        where: { id: avatar.id },
        data: {
          status: "completed",
          images: {
            original: {
              url: `https://example.com/avatars/${avatar.id}-original.png`,
              key: `avatars/${avatar.id}-original.png`
            },
            expressions: {
              neutral: `https://example.com/avatars/${avatar.id}-neutral.png`,
              happy: `https://example.com/avatars/${avatar.id}-happy.png`,
              sad: `https://example.com/avatars/${avatar.id}-sad.png`,
              angry: `https://example.com/avatars/${avatar.id}-angry.png`,
              surprised: `https://example.com/avatars/${avatar.id}-surprised.png`,
              wink: `https://example.com/avatars/${avatar.id}-wink.png`
            }
          }
        }
      });
    }, 2000);

    return NextResponse.json({
      id: avatar.id,
      status: avatar.status,
      creditsRemaining: creditResult.newBalance
    });

  } catch (error) {
    console.error("Error creating avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}