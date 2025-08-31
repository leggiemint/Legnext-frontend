import connectMongo from "@/libs/mongoose";

// 幂等键类型
export type IdempotencyKey = string;

// 幂等记录接口
export interface IdempotencyRecord {
  _id?: string;
  key: IdempotencyKey;
  resource: string;
  action: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

// 幂等管理器类
export class IdempotencyManager {
  private static instance: IdempotencyManager;
  private readonly COLLECTION_NAME = 'idempotency_keys';
  private readonly DEFAULT_TTL_HOURS = 24; // 默认24小时过期

  private constructor() {}

  public static getInstance(): IdempotencyManager {
    if (!IdempotencyManager.instance) {
      IdempotencyManager.instance = new IdempotencyManager();
    }
    return IdempotencyManager.instance;
  }

  /**
   * 检查幂等键是否存在
   */
  async checkIdempotency(
    key: IdempotencyKey,
    resource: string,
    action: string
  ): Promise<IdempotencyRecord | null> {
    try {
      await connectMongo();

      const IdempotencyModel = this.getIdempotencyModel();
      const record = await IdempotencyModel.findOne({
        key,
        resource,
        action
      });

      if (record && record.expiresAt < new Date()) {
        // 记录已过期，删除并返回null
        await IdempotencyModel.deleteOne({ _id: record._id });
        return null;
      }

      return record;
    } catch (error) {
      console.error('❌ Error checking idempotency:', error);
      // 如果检查失败，为了安全性返回null（允许重试）
      return null;
    }
  }

  /**
   * 开始处理操作（创建或更新记录）
   */
  async startProcessing(
    key: IdempotencyKey,
    resource: string,
    action: string,
    ttlHours: number = this.DEFAULT_TTL_HOURS,
    metadata?: Record<string, any>
  ): Promise<IdempotencyRecord> {
    try {
      await connectMongo();

      const IdempotencyModel = this.getIdempotencyModel();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

      const recordData = {
        key,
        resource,
        action,
        status: 'processing' as const,
        createdAt: now,
        updatedAt: now,
        expiresAt,
        metadata: metadata || {}
      };

      const record = await IdempotencyModel.findOneAndUpdate(
        { key, resource, action },
        recordData,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      console.log(`🔄 Started processing idempotent operation:`, {
        key,
        resource,
        action,
        recordId: record._id
      });

      return record;
    } catch (error) {
      console.error('❌ Error starting idempotent processing:', error);
      throw new Error(`Failed to start idempotent processing: ${error.message}`);
    }
  }

  /**
   * 完成处理操作
   */
  async completeProcessing(
    key: IdempotencyKey,
    resource: string,
    action: string,
    result?: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await connectMongo();

      const IdempotencyModel = this.getIdempotencyModel();
      const updateData: Partial<IdempotencyRecord> = {
        status: 'completed',
        updatedAt: new Date(),
        result
      };

      if (metadata) {
        updateData.metadata = { ...(updateData.metadata || {}), ...metadata };
      }

      await IdempotencyModel.updateOne(
        { key, resource, action },
        updateData
      );

      console.log(`✅ Completed idempotent operation:`, {
        key,
        resource,
        action,
        hasResult: !!result
      });

    } catch (error) {
      console.error('❌ Error completing idempotent processing:', error);
      // 不抛出错误，避免影响主业务流程
    }
  }

  /**
   * 标记处理失败
   */
  async failProcessing(
    key: IdempotencyKey,
    resource: string,
    action: string,
    error: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await connectMongo();

      const IdempotencyModel = this.getIdempotencyModel();
      const updateData: Partial<IdempotencyRecord> = {
        status: 'failed',
        updatedAt: new Date(),
        error
      };

      if (metadata) {
        updateData.metadata = { ...(updateData.metadata || {}), ...metadata };
      }

      await IdempotencyModel.updateOne(
        { key, resource, action },
        updateData
      );

      console.log(`❌ Failed idempotent operation:`, {
        key,
        resource,
        action,
        error
      });

    } catch (updateError) {
      console.error('❌ Error recording idempotent failure:', updateError);
    }
  }

  /**
   * 清理过期记录
   */
  async cleanupExpiredRecords(): Promise<number> {
    try {
      await connectMongo();

      const IdempotencyModel = this.getIdempotencyModel();
      const result = await IdempotencyModel.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} expired idempotency records`);
      return result.deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up expired idempotency records:', error);
      return 0;
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    total: number;
    processing: number;
    completed: number;
    failed: number;
    expiredSoon: number;
  }> {
    try {
      await connectMongo();

      const IdempotencyModel = this.getIdempotencyModel();
      const now = new Date();
      const soon = new Date(now.getTime() + 60 * 60 * 1000); // 1小时内过期

      const [
        total,
        processing,
        completed,
        failed,
        expiredSoon
      ] = await Promise.all([
        IdempotencyModel.countDocuments({}),
        IdempotencyModel.countDocuments({ status: 'processing' }),
        IdempotencyModel.countDocuments({ status: 'completed' }),
        IdempotencyModel.countDocuments({ status: 'failed' }),
        IdempotencyModel.countDocuments({
          expiresAt: { $lt: soon, $gt: now }
        })
      ]);

      return {
        total,
        processing,
        completed,
        failed,
        expiredSoon
      };
    } catch (error) {
      console.error('❌ Error getting idempotency stats:', error);
      return {
        total: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        expiredSoon: 0
      };
    }
  }

  /**
   * 生成幂等键
   */
  static generateKey(resource: string, action: string, identifier: string): IdempotencyKey {
    return `${resource}:${action}:${identifier}`;
  }

  /**
   * 获取Mongoose模型
   */
  private getIdempotencyModel() {
    const mongoose = require('mongoose') as typeof import('mongoose');

    if (!mongoose.models.IdempotencyKey) {
      const schema = new mongoose.Schema<IdempotencyRecord>({
        key: { type: String, required: true, unique: true },
        resource: { type: String, required: true },
        action: { type: String, required: true },
        status: {
          type: String,
          required: true,
          enum: ['processing', 'completed', 'failed']
        },
        result: { type: mongoose.Schema.Types.Mixed },
        error: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
        metadata: { type: mongoose.Schema.Types.Mixed }
      }, {
        timestamps: false // 手动管理时间戳
      });

      // 复合索引
      schema.index({ key: 1, resource: 1, action: 1 }, { unique: true });
      schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL索引
      schema.index({ status: 1, updatedAt: 1 });

      mongoose.models.IdempotencyKey = mongoose.model<IdempotencyRecord>('IdempotencyKey', schema);
    }

    return mongoose.models.IdempotencyKey;
  }
}

// 导出单例实例
export const idempotencyManager = IdempotencyManager.getInstance();

// 便捷函数
export function generateIdempotencyKey(resource: string, action: string, identifier: string): IdempotencyKey {
  return IdempotencyManager.generateKey(resource, action, identifier);
}

// 装饰器函数
export function withIdempotency(resource: string, action: string, keyGenerator?: (args: any[]) => string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const manager = IdempotencyManager.getInstance();

      // 生成幂等键
      let idempotencyKey: IdempotencyKey;
      if (keyGenerator) {
        idempotencyKey = keyGenerator(args);
      } else {
        // 默认使用第一个参数作为标识符
        const identifier = args[0]?.id || args[0]?.eventId || JSON.stringify(args[0]);
        idempotencyKey = generateIdempotencyKey(resource, action, identifier);
      }

      // 检查是否已处理
      const existingRecord = await manager.checkIdempotency(idempotencyKey, resource, action);
      if (existingRecord) {
        if (existingRecord.status === 'completed') {
          console.log(`⏭️ Idempotent operation already completed: ${idempotencyKey}`);
          return existingRecord.result;
        } else if (existingRecord.status === 'processing') {
          console.log(`⏳ Idempotent operation already in progress: ${idempotencyKey}`);
          throw new Error('Operation already in progress');
        }
      }

      // 开始处理
      const record = await manager.startProcessing(idempotencyKey, resource, action);

      try {
        // 执行原始方法
        const result = await originalMethod.apply(this, args);

        // 完成处理
        await manager.completeProcessing(idempotencyKey, resource, action, result);

        return result;
      } catch (error) {
        // 记录失败
        await manager.failProcessing(idempotencyKey, resource, action, error.message);
        throw error;
      }
    };

    return descriptor;
  };
}
