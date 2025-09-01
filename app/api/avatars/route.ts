import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { prisma } from "@/libs/prisma";
import { consumeCredits, incrementImageCount } from "@/libs/user-service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const images = await prisma.midjourneyImage.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["completed", "generating", "pending", "failed"] }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        prompt: true,
        model: true,
        status: true,
        progress: true,
        imageUrl: true,
        storedImages: true,
        isFavorite: true,
        createdAt: true
      }
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
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

    // Create image generation record
    const image = await prisma.midjourneyImage.create({
      data: {
        userId: session.user.id,
        prompt,
        model: style || "v6",
        status: "pending"
      }
    });

    // Increment user's image count
    await incrementImageCount(session.user.id);

    // TODO: Add your Midjourney API generation logic here
    // For now, we'll simulate generation with a completed status
    setTimeout(async () => {
      await prisma.midjourneyImage.update({
        where: { id: image.id },
        data: {
          status: "completed",
          progress: 100,
          imageUrl: `https://example.com/images/${image.id}.png`,
          storedImages: {
            original: {
              url: `https://example.com/images/${image.id}.png`,
              key: `images/${image.id}.png`
            }
          }
        }
      });
    }, 2000);

    return NextResponse.json({
      id: image.id,
      status: image.status,
      creditsRemaining: creditResult.newBalance
    });

  } catch (error) {
    console.error("Error creating image:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}