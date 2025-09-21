import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { log } from './logger';

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
    log.info(`☁️ Starting R2 upload`, {
      key,
      fileSizeBytes: file.length,
      contentType,
      bucket: BUCKET_NAME,
      endpoint: process.env.R2_ENDPOINT,
      publicUrl: process.env.R2_PUBLIC_URL
    });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      // Cloudflare R2不支持ACL，移除这个设置
      // 需要在R2 dashboard中配置bucket为public或使用custom domain
    });

    const uploadStart = Date.now();
    const result = await r2Client.send(command);
    const uploadTime = Date.now() - uploadStart;
    
    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    
    log.info(`✅ R2 upload successful`, {
      key,
      url,
      uploadTimeMs: uploadTime,
      etag: result.ETag,
      versionId: result.VersionId
    });
    
    // 验证上传的文件是否可以访问
    let finalUrl = url;
    try {
      const testResponse = await fetch(url, { method: 'HEAD' });
      log.debug(`🔍 Upload verification`, {
        key,
        url,
        testStatus: testResponse.status,
        testStatusText: testResponse.statusText,
        accessible: testResponse.ok
      });
      
      if (!testResponse.ok) {
        log.warn(`⚠️ Public URL not accessible, generating presigned URL as fallback`, {
          key,
          publicUrl: url,
          status: testResponse.status,
          statusText: testResponse.statusText
        });
        
        // 生成24小时有效的预签名URL作为备选
        const presignedResult = await generatePresignedDownloadUrl(key, 24 * 60 * 60);
        if (presignedResult.success) {
          finalUrl = presignedResult.url!;
          log.info(`✅ Generated presigned URL as fallback`, {
            key,
            presignedUrl: finalUrl
          });
        }
      }
    } catch (testError) {
      log.warn(`⚠️ Could not verify upload accessibility, generating presigned URL`, {
        key,
        url,
        testError: testError instanceof Error ? testError.message : testError
      });
      
      // 生成预签名URL作为备选
      const presignedResult = await generatePresignedDownloadUrl(key, 24 * 60 * 60);
      if (presignedResult.success) {
        finalUrl = presignedResult.url!;
        log.info(`✅ Generated presigned URL as fallback`, {
          key,
          presignedUrl: finalUrl
        });
      }
    }
    
    return {
      success: true,
      url: finalUrl
    };
  } catch (error) {
    log.error(`💥 R2 upload failed`, {
      key,
      fileSizeBytes: file.length,
      contentType,
      bucket: BUCKET_NAME,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    
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

// 生成预签名下载URL
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    
    log.debug(`🔗 Generated presigned download URL`, {
      key,
      expiresIn,
      url: url.substring(0, 100) + '...'
    });
    
    return {
      success: true,
      url
    };
  } catch (error) {
    log.error(`💥 Failed to generate presigned download URL`, {
      key,
      expiresIn,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message
      } : error
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate presigned download URL'
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
