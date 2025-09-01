import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2存储配置
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

// 文件上传到R2
export async function uploadToR2(
  key: string,
  file: Buffer,
  contentType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read', // 或者根据需要设置权限
    });

    await r2Client.send(command);
    
    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    
    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

// 从R2获取文件URL
export async function getR2FileUrl(key: string): Promise<string> {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// 生成预签名上传URL
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    
    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('Generate presigned URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate presigned URL'
    };
  }
}

// 删除R2中的文件
export async function deleteFromR2(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('R2 delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

// 生成唯一的文件key
export function generateFileKey(userId: string, originalName: string, type: 'reference' | 'avatar' | 'expression'): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || 'png';
  
  return `${type}/${userId}/${timestamp}-${randomId}.${extension}`;
}
