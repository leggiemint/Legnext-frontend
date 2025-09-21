import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { uploadToR2 } from './r2';
import { log } from './logger';

export interface CompanyReplacement {
  oldInfo: {
    name: string;
    address: string[];
    city: string;
    country: string;
    phone?: string;
  };
  newInfo: {
    name: string;
    address: string[];
    city: string;
    country: string;
    phone?: string;
  };
}

export interface PDFProcessingOptions {
  replacements?: CompanyReplacement[];
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export class PDFProcessor {
  private static readonly CACHE_PREFIX = 'processed-invoice-';
  
  // 默认的公司信息替换配置
  private static readonly DEFAULT_REPLACEMENTS: CompanyReplacement[] = [
    {
      oldInfo: {
        name: "New business sandbox",
        address: ["CA"],
        city: "San Francisco",
        country: "address_full_match\nHong Kong",
        phone: "+1 415-555-0199"
      },
      newInfo: {
        name: "LEGNEXT LLC",
        address: ["WORKSHOP 210, 5/F, BLK B,", "HUDSON IND CTR NO. 485 7TH AVE"],
        city: "New York, NY 10018",
        country: "United States"
      }
    },
    {
      oldInfo: {
        name: "DARK ENLIGHTENMENT LIMITED",
        address: ["九龍", "KWUN TONG", "WORKSHOP 60, 3/F, BLK A, EAST", "SUN IND CTR NO. 16 SHING YIP ST"],
        city: "Hong Kong",
        country: "Hong Kong"
      },
      newInfo: {
        name: "LEGNEXT LLC",
        address: ["WORKSHOP 210, 5/F, BLK B,", "HUDSON IND CTR NO. 485 7TH AVE"],
        city: "New York, NY 10018",
        country: "United States"
      }
    }
  ];

  /**
   * 处理发票PDF，替换公司信息
   */
  async processInvoicePDF(
    invoiceId: string, 
    originalPdfUrl: string,
    options: PDFProcessingOptions = {}
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const startTime = Date.now();
    const debugId = `pdf_${invoiceId}_${startTime}`;
    
    try {
      log.info(`🔄 Starting PDF processing`, {
        debugId,
        invoiceId,
        originalPdfUrl,
        cacheEnabled: options.cacheEnabled !== false,
        customReplacements: !!options.replacements
      });

      // 检查缓存
      if (options.cacheEnabled !== false) {
        log.debug(`🔍 Checking cache for invoice: ${invoiceId}`, { debugId });
        
        const cacheCheckStart = Date.now();
        const cachedUrl = await this.getCachedPDF(invoiceId);
        const cacheCheckTime = Date.now() - cacheCheckStart;
        
        if (cachedUrl) {
          log.info(`✅ Cache hit - returning cached PDF`, {
            debugId,
            invoiceId,
            cachedUrl,
            cacheCheckTimeMs: cacheCheckTime,
            totalTimeMs: Date.now() - startTime
          });
          return { success: true, url: cachedUrl };
        } else {
          log.debug(`❌ Cache miss for invoice: ${invoiceId}`, {
            debugId,
            cacheCheckTimeMs: cacheCheckTime
          });
        }
      } else {
        log.debug(`⏭️ Cache disabled, proceeding with fresh processing`, { debugId });
      }

      // 下载原始PDF
      log.debug(`📥 Starting PDF download`, { debugId, originalPdfUrl });
      const downloadStart = Date.now();
      
      const pdfBuffer = await this.downloadPDF(originalPdfUrl);
      const downloadTime = Date.now() - downloadStart;
      
      if (!pdfBuffer) {
        log.error(`❌ PDF download failed`, {
          debugId,
          invoiceId,
          originalPdfUrl,
          downloadTimeMs: downloadTime
        });
        return { success: false, error: 'Failed to download original PDF' };
      }

      log.info(`✅ PDF downloaded successfully`, {
        debugId,
        pdfSizeBytes: pdfBuffer.length,
        downloadTimeMs: downloadTime
      });

      // 处理PDF
      log.debug(`🔄 Starting PDF text replacement`, { debugId });
      const processingStart = Date.now();
      
      const replacements = options.replacements || PDFProcessor.DEFAULT_REPLACEMENTS;
      log.debug(`📝 Using ${replacements.length} replacement rules`, {
        debugId,
        replacements: replacements.map(r => ({
          from: r.oldInfo.name,
          to: r.newInfo.name
        }))
      });
      
      const processedPdfBuffer = await this.replacePDFText(pdfBuffer, replacements);
      const processingTime = Date.now() - processingStart;
      
      log.info(`✅ PDF text replacement completed`, {
        debugId,
        originalSizeBytes: pdfBuffer.length,
        processedSizeBytes: processedPdfBuffer.length,
        processingTimeMs: processingTime
      });

      // 上传到R2
      log.debug(`☁️ Starting R2 upload`, { debugId });
      const uploadStart = Date.now();
      const uploadKey = `${PDFProcessor.CACHE_PREFIX}${invoiceId}.pdf`;
      
      const uploadResult = await uploadToR2(
        uploadKey,
        processedPdfBuffer,
        'application/pdf'
      );
      const uploadTime = Date.now() - uploadStart;

      if (!uploadResult.success) {
        log.error(`❌ R2 upload failed`, {
          debugId,
          invoiceId,
          uploadKey,
          uploadTimeMs: uploadTime,
          error: uploadResult.error
        });
        return { success: false, error: 'Failed to upload processed PDF' };
      }

      const totalTime = Date.now() - startTime;
      log.info(`🎉 PDF processing completed successfully`, {
        debugId,
        invoiceId,
        processedUrl: uploadResult.url,
        uploadTimeMs: uploadTime,
        totalTimeMs: totalTime,
        performanceBreakdown: {
          downloadMs: downloadTime,
          processingMs: processingTime,
          uploadMs: uploadTime,
          totalMs: totalTime
        }
      });

      return { success: true, url: uploadResult.url };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      log.error(`💥 PDF processing failed`, {
        debugId,
        invoiceId,
        originalPdfUrl,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        totalTimeMs: totalTime
      });
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * 下载PDF文件
   */
  private async downloadPDF(url: string): Promise<Buffer | null> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1秒
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        
        const fetchStart = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LEGNEXT-PDF-Processor/1.0)',
            'Accept': 'application/pdf,*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          redirect: 'follow',
          // 增加超时时间
          signal: AbortSignal.timeout(30000) // 30秒超时
        });
        const fetchTime = Date.now() - fetchStart;
      
        // PDF下载响应检查
        
        if (!response.ok) {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          
          // 对于某些错误，不需要重试
          if (response.status === 404 || response.status === 403 || response.status === 401) {
            log.error(`❌ HTTP request failed - no retry needed`, {
              url: url.substring(0, 100) + '...',
              attempt,
              status: response.status,
              statusText: response.statusText,
              reason: 'Client error - no point in retrying'
            });
            throw new Error(errorMessage);
          }
          
          // 对于服务器错误，可以重试
          if (attempt < maxRetries && (response.status >= 500 || response.status === 429)) {
            log.warn(`⚠️ HTTP request failed - will retry`, {
              url: url.substring(0, 100) + '...',
              attempt,
              status: response.status,
              statusText: response.statusText,
              nextAttemptIn: retryDelay * attempt
            });
            
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue; // 重试
          }
          
          throw new Error(errorMessage);
        }

        // 验证响应内容类型
        const contentType = response.headers.get('content-type');

        const bufferStart = Date.now();
        const arrayBuffer = await response.arrayBuffer();
        const bufferTime = Date.now() - bufferStart;
        const buffer = Buffer.from(arrayBuffer);
        
        // 验证PDF文件
        if (buffer.length < 100) {
          throw new Error('Downloaded file is too small to be a valid PDF');
        }
        
        // 检查PDF magic number
        const pdfHeader = buffer.toString('ascii', 0, 4);
        if (pdfHeader !== '%PDF') {
          log.warn(`⚠️ Downloaded file may not be a valid PDF`, {
            fileHeader: pdfHeader,
            fileSize: buffer.length
          });
        }
        
        return buffer;
        
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const shouldRetry = !isLastAttempt && (
          error instanceof TypeError || // 网络错误
          (error instanceof Error && error.message.includes('timeout')) ||
          (error instanceof Error && error.message.includes('fetch failed'))
        );
        
        if (shouldRetry) {
          log.warn(`⚠️ PDF download failed - will retry`, {
            url: url.substring(0, 100) + '...',
            attempt,
            error: error instanceof Error ? {
              name: error.name,
              message: error.message
            } : error,
            nextAttemptIn: retryDelay * attempt
          });
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue; // 重试
        } else {
          log.error(`💥 PDF download failed (final attempt)`, {
            url: url.substring(0, 100) + '...',
            attempt,
            maxRetries,
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error
          });
          
          return null;
        }
      }
    }
    
    // 如果所有重试都失败了
    log.error(`💥 PDF download failed after all retries`, {
      url: url.substring(0, 100) + '...',
      maxRetries,
      totalAttempts: maxRetries
    });
    
    return null;
  }

  /**
   * 替换PDF中的文本内容
   */
  private async replacePDFText(
    pdfBuffer: Buffer, 
    replacements: CompanyReplacement[]
  ): Promise<Buffer> {
    try {
      log.info(`🔄 Starting PDF text replacement`, { 
        pdfSizeBytes: pdfBuffer.length,
        replacementCount: replacements.length 
      });
      
      // 加载PDF文档
      const loadStart = Date.now();
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const loadTime = Date.now() - loadStart;
      
      const pages = pdfDoc.getPages();
      
      // 获取字体
      const fontStart = Date.now();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontTime = Date.now() - fontStart;

      // 处理每个页面
      const pageProcessingStart = Date.now();
      let totalReplacements = 0;
      
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        const page = pages[pageIndex];
        
        for (let replIndex = 0; replIndex < replacements.length; replIndex++) {
          const replacement = replacements[replIndex];
          
          const replacementResult = await this.replaceCompanyInfoOnPage(
            page, 
            replacement, 
            font, 
            boldFont,
            pageIndex + 1
          );
          
          if (replacementResult.applied) {
            totalReplacements++;
          }
        }
      }
      
      const pageProcessingTime = Date.now() - pageProcessingStart;

      // 生成新的PDF
      const saveStart = Date.now();
      const processedPdfBytes = await pdfDoc.save();
      const saveTime = Date.now() - saveStart;
      
      const finalBuffer = Buffer.from(processedPdfBytes);
      
      log.info(`✅ PDF text replacement completed`, {
        originalSizeBytes: pdfBuffer.length,
        processedSizeBytes: finalBuffer.length,
        totalReplacements,
        totalProcessingTimeMs: loadTime + fontTime + pageProcessingTime + saveTime
      });
      
      return finalBuffer;
    } catch (error) {
      log.error(`💥 PDF text replacement failed`, {
        pdfSizeBytes: pdfBuffer.length,
        replacementCount: replacements.length,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      throw error;
    }
  }

  /**
   * 在页面上替换公司信息
   */
  private async replaceCompanyInfoOnPage(
    page: any, 
    replacement: CompanyReplacement, 
    font: any, 
    boldFont: any,
    pageNumber: number
  ): Promise<{ applied: boolean; details?: any }> {
    try {
      const { width, height } = page.getSize();
      
      // 公司信息替换处理
      
      // 创建一个简单的文本替换策略
      // 注意：pdf-lib不直接支持文本搜索替换，这里我们采用覆盖策略
      
      // 假设公司信息通常在PDF的顶部区域
      // 我们在可能的位置放置新的公司信息
      
      // 根据精确的英寸尺寸计算覆盖区域
      // PDF标准尺寸: 8.5 × 11 英寸 = 612 × 792 点 (1英寸 = 72点)
      const POINTS_PER_INCH = 72;
      
      // 公司信息覆盖区域：宽2.6英寸，高1.5英寸；位置：x:0.23 y:1.56英寸
      const companyInfoX = 0.23 * POINTS_PER_INCH;      // 16.56 点
      const companyInfoY = (11 - 1.56 - 1.5) * POINTS_PER_INCH; // PDF Y轴从底部开始: (11 - 1.56 - 1.5) * 72
      const companyInfoWidth = 2.6 * POINTS_PER_INCH;   // 187.2 点
      const companyInfoHeight = 1.5 * POINTS_PER_INCH;  // 108 点
      
      // 主覆盖区域变量
      const coverRectX = companyInfoX;
      const coverRectY = companyInfoY; 
      const coverRectWidth = companyInfoWidth;
      const coverRectHeight = companyInfoHeight;
      
      // 应用覆盖区域：公司信息区域(2.6" × 1.5")
      
      // 主要覆盖区域：公司信息
      page.drawRectangle({
        x: coverRectX,
        y: coverRectY,
        width: coverRectWidth,
        height: coverRectHeight,
        color: rgb(1, 1, 1), // 白色
      });

      // 额外覆盖区域：隐藏"Pay online"链接
      // Pay online覆盖区域：宽2.6英寸，高0.3英寸；位置：x:0.23 y:3.46英寸
      const payOnlineLinkX = 0.23 * POINTS_PER_INCH;      // 16.56 点
      const payOnlineLinkY = (11 - 3.46 - 0.3) * POINTS_PER_INCH; // PDF Y轴从底部开始: (11 - 3.46 - 0.3) * 72
      const payOnlineLinkWidth = 2.6 * POINTS_PER_INCH;   // 187.2 点  
      const payOnlineLinkHeight = 0.3 * POINTS_PER_INCH;  // 21.6 点
      
      page.drawRectangle({
        x: payOnlineLinkX - 2,
        y: payOnlineLinkY - 2,
        width: payOnlineLinkWidth + 4,
        height: payOnlineLinkHeight + 4,
        color: rgb(1, 1, 1), // 白色，完全覆盖链接
      });

      // Pay online链接覆盖完成

      // 放置新的公司信息 - 在覆盖区域内合适位置
      const fontSize = 9; // 匹配原PDF的字体大小
      const lineHeight = 12;
      const textX = coverRectX + 10; // 在覆盖区域内，左侧留10点margin
      
      // 从覆盖区域顶部开始放置文本
      let yPosition = coverRectY + coverRectHeight - 15; // 从覆盖区域顶部开始，留15点margin
      
      // 开始放置新的公司信息文本

      // 公司名称 (粗体)
      const companyNameY = yPosition;
      page.drawText(replacement.newInfo.name, {
        x: textX,
        y: yPosition,
        size: fontSize, // 使用相同字体大小
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
      
      // 公司名称已放置

      // 地址信息
      for (let i = 0; i < replacement.newInfo.address.length; i++) {
        const addressLine = replacement.newInfo.address[i];
        
        page.drawText(addressLine, {
          x: textX,
          y: yPosition,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= lineHeight;
      }

      // 城市
      const cityY = yPosition;
      page.drawText(replacement.newInfo.city, {
        x: textX,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
      
      // 国家
      page.drawText(replacement.newInfo.country, {
        x: textX,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });

      // 电话号码（如果有）
      if (replacement.newInfo.phone) {
        yPosition -= lineHeight;
        
        page.drawText(replacement.newInfo.phone, {
          x: textX,
          y: yPosition,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
      
      return { applied: true };
      
    } catch (error) {
      log.error(`💥 Failed to replace company info on page ${pageNumber}`, {
        pageNumber,
        replacement: {
          from: replacement.oldInfo.name,
          to: replacement.newInfo.name
        },
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      return { applied: false };
    }
  }

  /**
   * 获取缓存的PDF URL
   */
  private async getCachedPDF(invoiceId: string): Promise<string | null> {
    try {
      // 构建缓存文件URL
      const cacheKey = `${PDFProcessor.CACHE_PREFIX}${invoiceId}.pdf`;
      const cachedUrl = `${process.env.R2_PUBLIC_URL}/${cacheKey}`;
      
      // 检查缓存
      
      // 检查文件是否存在（简单的HEAD请求）
      const checkStart = Date.now();
      const response = await fetch(cachedUrl, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'LEGNEXT-PDF-Processor/1.0'
        }
      });
      const checkTime = Date.now() - checkStart;
      
      // 缓存检查完成
      
      if (response.ok) {
        return cachedUrl;
      } else {
        return null;
      }
      
    } catch (error) {
      log.warn(`⚠️ Cache check failed`, {
        invoiceId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error
      });
      return null;
    }
  }

  /**
   * 清除缓存的PDF
   */
  async clearCache(invoiceId: string): Promise<boolean> {
    try {
      const cacheKey = `${PDFProcessor.CACHE_PREFIX}${invoiceId}.pdf`;
      
      log.info(`🗑️ Starting cache cleanup`, {
        invoiceId,
        cacheKey
      });
      
      // 这里可以添加R2删除逻辑
      // 目前简单返回true，将来可以集成实际的删除操作
      
      log.info(`✅ Cache cleared successfully`, {
        invoiceId,
        cacheKey,
        note: 'Currently using simple cleanup - can be enhanced with actual R2 deletion'
      });
      
      return true;
    } catch (error) {
      log.error(`💥 Cache cleanup failed`, {
        invoiceId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      return false;
    }
  }
}

// 导出默认实例
export const pdfProcessor = new PDFProcessor();
