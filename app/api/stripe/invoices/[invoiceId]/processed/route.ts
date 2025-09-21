import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/next-auth';
import { getInvoiceDetails } from '@/libs/stripe-client';
import { getUserWithProfile } from '@/libs/user-helpers';
import { pdfProcessor } from '@/libs/pdf-processor';
import { log } from '@/libs/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest, 
  { params }: { params: { invoiceId: string } }
) {
  const requestId = `pdf_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    log.info(`🔄 Starting PDF processing request`, {
      requestId,
      invoiceId: params.invoiceId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer')
    });
    
    // 验证用户认证
    const authStart = Date.now();
    const session = await getServerSession(authOptions);
    const authTime = Date.now() - authStart;
    
    if (!session?.user?.id) {
      log.warn(`❌ Unauthorized PDF processing request`, {
        requestId,
        invoiceId: params.invoiceId,
        authTimeMs: authTime,
        hasSession: !!session,
        hasUserId: !!session?.user?.id
      });
      
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    log.debug(`✅ User authenticated`, {
      requestId,
      userId: session.user.id,
      userEmail: session.user.email,
      authTimeMs: authTime
    });

    // 获取用户信息
    const userStart = Date.now();
    const user = await getUserWithProfile(session.user.id);
    const userTime = Date.now() - userStart;
    
    if (!user?.email) {
      log.error(`❌ User profile not found`, {
        requestId,
        userId: session.user.id,
        userTimeMs: userTime
      });
      
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    log.debug(`✅ User profile retrieved`, {
      requestId,
      userId: session.user.id,
      userEmail: user.email,
      userTimeMs: userTime
    });

    // 获取发票详情
    const invoiceStart = Date.now();
    const invoice = await getInvoiceDetails(params.invoiceId);
    const invoiceTime = Date.now() - invoiceStart;
    
    if (!invoice) {
      log.error(`❌ Invoice not found`, {
        requestId,
        invoiceId: params.invoiceId,
        userId: session.user.id,
        invoiceTimeMs: invoiceTime
      });
      
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    log.debug(`✅ Invoice retrieved`, {
      requestId,
      invoiceId: params.invoiceId,
      invoiceStatus: invoice.status,
      invoiceAmount: invoice.amount_paid,
      invoiceCurrency: invoice.currency,
      hasPdf: !!invoice.invoice_pdf,
      invoiceTimeMs: invoiceTime
    });

    // 验证发票所有权 - 检查发票是否属于当前用户
    // 这里需要通过customer ID来验证
    // 注意：实际实现中可能需要更复杂的所有权验证逻辑
    try {
      // 获取用户的Stripe客户ID来验证所有权
      const userCustomerId = await getUserStripeCustomerId(session.user.id, user.email);
      
      if (invoice.customer !== userCustomerId) {
        log.warn(`🚫 User ${session.user.id} attempted to access invoice ${params.invoiceId} that doesn't belong to them`);
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        );
      }
    } catch (ownershipError) {
      log.error('Error verifying invoice ownership:', ownershipError);
      return NextResponse.json(
        { error: 'Unable to verify invoice ownership' },
        { status: 403 }
      );
    }

    // 检查发票是否有PDF
    if (!invoice.invoice_pdf) {
      return NextResponse.json(
        { error: 'Invoice PDF not available' },
        { status: 404 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const customReplacements = searchParams.get('replacements');

    log.debug(`📋 Processing query parameters`, {
      requestId,
      forceRefresh,
      hasCustomReplacements: !!customReplacements,
      customReplacementsLength: customReplacements?.length || 0
    });

    // 处理PDF
    const processingOptions: any = {
      cacheEnabled: !forceRefresh,
      cacheTTL: 24 * 60 * 60 * 1000, // 24小时缓存
    };

    // 如果有自定义替换规则，解析它们
    if (customReplacements) {
      try {
        const parsedReplacements = JSON.parse(decodeURIComponent(customReplacements));
        processingOptions.replacements = parsedReplacements;
        
        log.debug(`📝 Custom replacements parsed`, {
          requestId,
          replacementCount: parsedReplacements.length
        });
      } catch (parseError) {
        log.warn(`⚠️ Invalid custom replacements provided`, {
          requestId,
          error: parseError instanceof Error ? parseError.message : parseError,
          customReplacements: customReplacements.substring(0, 100) + '...'
        });
        // 继续使用默认替换规则
      }
    }

    log.info(`📄 Starting PDF processing`, {
      requestId,
      invoiceId: params.invoiceId,
      originalUrl: invoice.invoice_pdf,
      processingOptions: {
        cacheEnabled: processingOptions.cacheEnabled,
        cacheTTL: processingOptions.cacheTTL,
        hasCustomReplacements: !!processingOptions.replacements,
        forceRefresh
      }
    });

    const processingStart = Date.now();
    let result = await pdfProcessor.processInvoicePDF(
      params.invoiceId,
      invoice.invoice_pdf,
      processingOptions
    );
    let processingTime = Date.now() - processingStart;

    // 如果PDF处理失败，尝试重新获取发票和PDF URL
    if (!result.success && result.error?.includes('Failed to download')) {
      log.warn(`⚠️ PDF download failed, attempting to refresh invoice data`, {
        requestId,
        invoiceId: params.invoiceId,
        originalError: result.error,
        processingTimeMs: processingTime
      });
      
      try {
        // 重新获取发票信息，可能PDF URL已经更新
        const refreshedInvoice = await getInvoiceDetails(params.invoiceId);
        
        if (refreshedInvoice?.invoice_pdf && refreshedInvoice.invoice_pdf !== invoice.invoice_pdf) {
          log.info(`🔄 Found updated PDF URL, retrying with new URL`, {
            requestId,
            invoiceId: params.invoiceId,
            oldUrl: invoice.invoice_pdf?.substring(0, 100) + '...',
            newUrl: refreshedInvoice.invoice_pdf.substring(0, 100) + '...'
          });
          
          const retryStart = Date.now();
          result = await pdfProcessor.processInvoicePDF(
            params.invoiceId,
            refreshedInvoice.invoice_pdf,
            processingOptions
          );
          const retryTime = Date.now() - retryStart;
          processingTime += retryTime;
          
          log.debug(`🔄 Retry processing completed`, {
            requestId,
            retrySuccess: result.success,
            retryTimeMs: retryTime
          });
        } else {
          log.debug(`ℹ️ No new PDF URL found`, {
            requestId,
            refreshedPdfUrl: refreshedInvoice?.invoice_pdf?.substring(0, 100) + '...',
            sameAsOriginal: refreshedInvoice?.invoice_pdf === invoice.invoice_pdf
          });
        }
      } catch (refreshError) {
        log.warn(`⚠️ Failed to refresh invoice data`, {
          requestId,
          refreshError: refreshError instanceof Error ? refreshError.message : refreshError
        });
      }
    }

    if (!result.success) {
      log.error(`💥 PDF processing failed (final)`, {
        requestId,
        invoiceId: params.invoiceId,
        userId: session.user.id,
        error: result.error,
        processingTimeMs: processingTime,
        totalTimeMs: Date.now() - startTime
      });
      
      return NextResponse.json(
        { 
          error: result.error || 'PDF processing failed',
          fallbackUrl: invoice.invoice_pdf, // 提供原始PDF URL作为降级选项
          suggestion: 'Try downloading the original PDF directly'
        },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - startTime;
    
    // 记录成功的处理
    log.info(`🎉 PDF processing completed successfully`, {
      requestId,
      invoiceId: params.invoiceId,
      userId: session.user.id,
      userEmail: user.email,
      originalUrl: invoice.invoice_pdf,
      processedUrl: result.url,
      performanceMetrics: {
        authTimeMs: authTime,
        userTimeMs: userTime, 
        invoiceTimeMs: invoiceTime,
        processingTimeMs: processingTime,
        totalTimeMs: totalTime
      }
    });

    // 返回处理后的PDF URL
    return NextResponse.json({
      success: true,
      originalUrl: invoice.invoice_pdf,
      processedUrl: result.url,
      invoiceId: params.invoiceId,
      processingDate: new Date().toISOString(),
      requestId,
      processingTimeMs: processingTime
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    log.error(`💥 PDF processing API error`, {
      requestId,
      invoiceId: params.invoiceId,
      totalTimeMs: totalTime,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 清除特定发票的PDF缓存
 */
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { invoiceId: string } }
) {
  const requestId = `pdf_cache_del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    log.info(`🗑️ Starting cache deletion request`, {
      requestId,
      invoiceId: params.invoiceId,
      timestamp: new Date().toISOString()
    });
    
    // 验证用户认证
    const authStart = Date.now();
    const session = await getServerSession(authOptions);
    const authTime = Date.now() - authStart;
    
    if (!session?.user?.id) {
      log.warn(`❌ Unauthorized cache deletion request`, {
        requestId,
        invoiceId: params.invoiceId,
        authTimeMs: authTime
      });
      
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    log.debug(`✅ User authenticated for cache deletion`, {
      requestId,
      userId: session.user.id,
      authTimeMs: authTime
    });

    // 清除缓存
    const cacheStart = Date.now();
    const result = await pdfProcessor.clearCache(params.invoiceId);
    const cacheTime = Date.now() - cacheStart;
    const totalTime = Date.now() - startTime;
    
    if (result) {
      log.info(`✅ Cache cleared successfully`, {
        requestId,
        invoiceId: params.invoiceId,
        userId: session.user.id,
        cacheTimeMs: cacheTime,
        totalTimeMs: totalTime
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Cache cleared',
        requestId,
        cacheTimeMs: cacheTime
      });
    } else {
      log.error(`💥 Cache clearing failed`, {
        requestId,
        invoiceId: params.invoiceId,
        userId: session.user.id,
        cacheTimeMs: cacheTime,
        totalTimeMs: totalTime
      });
      
      return NextResponse.json(
        { error: 'Failed to clear cache' },
        { status: 500 }
      );
    }

  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    log.error(`💥 Cache clearing API error`, {
      requestId,
      invoiceId: params.invoiceId,
      totalTimeMs: totalTime,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 获取用户的Stripe客户ID
 */
async function getUserStripeCustomerId(userId: string, email: string): Promise<string> {
  // 导入Stripe客户相关函数
  const { getOrCreateStripeCustomer } = await import('@/libs/stripe-client');
  
  // 获取或创建Stripe客户
  return await getOrCreateStripeCustomer(userId, email);
}
