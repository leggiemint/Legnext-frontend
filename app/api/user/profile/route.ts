
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { getUserWithProfile } from "@/libs/user-service";
import { prisma } from "@/libs/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const userWithProfile = await getUserWithProfile(session.user.id);
    
    if (!userWithProfile) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(userWithProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name } = body;

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    // Update user name in the User table
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: name.trim() }
      });
    }

    // Return updated user data
    const updatedUser = await getUserWithProfile(session.user.id);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
