import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// GET /api/debug/user-lookup - 调试用户查找问题
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("🔍 [DEBUG] User lookup debug - Session data:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userIdType: typeof session?.user?.id
    });

    if (!session?.user) {
      return NextResponse.json({ 
        error: "No session found",
        debug: "User needs to be logged in"
      }, { status: 401 });
    }

    await connectMongo();
    console.log("✅ [DEBUG] MongoDB connected");

    const userId = session.user.id;
    const email = session.user.email;

    // 尝试所有可能的查找方法
    const lookupResults = {
      session: {
        userId,
        email,
        userIdType: typeof userId
      },
      searches: {} as any
    };

    // 1. 直接通过ID查找
    try {
      const userById = await User.findById(userId);
      lookupResults.searches.findById = {
        success: !!userById,
        result: userById ? { id: userById._id, email: userById.email, googleId: userById.googleId } : null
      };
    } catch (error) {
      lookupResults.searches.findById = {
        success: false,
        error: error.message
      };
    }

    // 2. 通过email查找
    if (email) {
      try {
        const userByEmail = await User.findOne({ email });
        lookupResults.searches.findByEmail = {
          success: !!userByEmail,
          result: userByEmail ? { id: userByEmail._id, email: userByEmail.email, googleId: userByEmail.googleId } : null
        };
      } catch (error) {
        lookupResults.searches.findByEmail = {
          success: false,
          error: error.message
        };
      }
    }

    // 3. 通过googleId查找
    try {
      const userByGoogleId = await User.findOne({ googleId: userId });
      lookupResults.searches.findByGoogleId = {
        success: !!userByGoogleId,
        result: userByGoogleId ? { id: userByGoogleId._id, email: userByGoogleId.email, googleId: userByGoogleId.googleId } : null
      };
    } catch (error) {
      lookupResults.searches.findByGoogleId = {
        success: false,
        error: error.message
      };
    }

    // 4. 联合查询
    try {
      const searchConditions = [];
      
      if (email) {
        searchConditions.push({ email });
      }
      
      if (userId) {
        if (/^[0-9a-fA-F]{24}$/.test(userId)) {
          searchConditions.push({ _id: userId });
        } else {
          searchConditions.push({ googleId: userId });
        }
      }
      
      const userByCombined = searchConditions.length > 0 
        ? await User.findOne({ $or: searchConditions })
        : null;
        
      lookupResults.searches.combinedSearch = {
        conditions: searchConditions,
        success: !!userByCombined,
        result: userByCombined ? { id: userByCombined._id, email: userByCombined.email, googleId: userByCombined.googleId } : null
      };
    } catch (error) {
      lookupResults.searches.combinedSearch = {
        success: false,
        error: error.message
      };
    }

    // 5. 列出所有用户 (限制10个，调试用)
    try {
      const allUsers = await User.find({}).limit(10).select('_id email googleId name createdAt');
      lookupResults.searches.allUsers = {
        count: allUsers.length,
        users: allUsers
      };
    } catch (error) {
      lookupResults.searches.allUsers = {
        error: error.message
      };
    }

    return NextResponse.json({
      message: "User lookup debug complete",
      debug: lookupResults
    });

  } catch (error) {
    console.error("💥 [DEBUG] Error in user lookup debug:", error);
    return NextResponse.json({
      error: "Debug failed",
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
