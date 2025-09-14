import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { uploadToR2, generateFileKey } from "@/libs/r2";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // 检查环境变量
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      return NextResponse.json(
        { error: "R2 storage not configured" }, 
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'reference' | 'avatar' | 'expression' || 'reference';

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" }, 
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "Only image files are allowed" }, 
        { status: 400 }
      );
    }

    // 验证文件大小 (5MB限制)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum 5MB allowed." }, 
        { status: 400 }
      );
    }

    // 生成文件key
    const fileKey = generateFileKey(session.user.id, file.name, type);

    // 转换文件为Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 上传到R2
    const uploadResult = await uploadToR2(fileKey, buffer, file.type);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Upload failed" }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileKey,
      url: uploadResult.url,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type
    });

  } catch (error) {
    console.error("Upload error:", error);
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

// 获取上传URL (用于前端直接上传)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('fileName');
    const contentType = searchParams.get('contentType');
    const type = searchParams.get('type') as 'reference' | 'avatar' | 'expression' || 'reference';

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" }, 
        { status: 400 }
      );
    }

    // 生成文件key
    const fileKey = generateFileKey(session.user.id, fileName, type);

    // 生成预签名URL
    const { generatePresignedUploadUrl } = await import('@/libs/r2');
    const presignedResult = await generatePresignedUploadUrl(fileKey, contentType);

    if (!presignedResult.success) {
      return NextResponse.json(
        { error: presignedResult.error || "Failed to generate upload URL" }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploadUrl: presignedResult.url,
      fileKey,
      expiresIn: 3600
    });

  } catch (error) {
    console.error("Generate upload URL error:", error);
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
